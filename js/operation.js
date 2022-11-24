//拖动变量
var areaId;
// 获取基本配置
function getBaseNodeConfig () {
    return Object.assign({}, visoConfig.baseStyle);
}
// 让元素可拖动
function addDraggable (id) {
    jsPlumb.draggable(id, {
        containment: 'parent'
    });
}
// 设置入口点
function setEnterPoint (id) {
    var config = getBaseNodeConfig();
    config.isSource = false;
    config.maxConnections = -1;
    jsPlumb.addEndpoint(id, {
        anchors: 'Top',
        uuid: id + '-in'
    }, config);
}
// 设置出口点
function setExitPoint (id, position) {
    var config = getBaseNodeConfig();
    config.isTarget = false;
    config.maxConnections = -1;
    jsPlumb.addEndpoint(id, {
        anchors: position || 'Bottom',
        uuid: id + '-out'
    }, config);
}
function setExitMenuItem (id) {
    $('#' + id).find('li').each(function (key, value) {
        setExitPoint(value.id, 'Right');
    });
}
// 初始化开始节点属性
function initBeginNode (id) {
    var config = getBaseNodeConfig()

    config.isTarget = false
    config.maxConnections = 1

    jsPlumb.addEndpoint(id, {
        anchors: 'Bottom',
        uuid: id + '-out'
    }, config)
}
// 放入拖动节点
function dropNode (tmp, position,uuid) {
    position.id = uuid.id;
    position.usemesg = uuid;
    // position.generateId = uuid.v1
    var html = template(tmp, position);
    $(areaId).append(html);
    initSetNode(tmp, position.id);
}
// 初始化节点设置
function initSetNode (template, id) {
    addDraggable(id);
    if (template === 'tpl-audio') {
        setEnterPoint(id);
        setExitPoint(id);
    } else if (template === 'tpl-menu') {
        setEnterPoint(id + '-heading');
        setExitMenuItem(id);
    }
}
// 删除一个节点以及
function emptyNode (id) {
    jsPlumb.remove(id);
}
function eventHandler (data) {
    if (data.type === 'deleteNode') {
        emptyNode(data.id);
    }
}
// 链接建立后的检查
// 当出现自连接的情况后，要将链接断开
function connectionBeforeDropCheck (info) {
    if(info.sourceId){
        var nextNode=$('#'+info.sourceId).attr('data-nextNode') || '';
        var nextNodearr=[];
        if(nextNode!=''){
             nextNodearr=$.trim(nextNode).split(',');
        }
        nextNodearr.push(info.targetId);
        nextNodearr=$.unique(nextNodearr);
        $('#'+info.sourceId).attr('data-nextNode',nextNodearr.join(','));
    }
    if (!info.connection.source.dataset.pid) {
        return true;
    }
    return info.connection.source.dataset.pid !== info.connection.target.dataset.id;
}
/*画线*/
var DataProcess = {
    inputData: function (nodes) {
        var ids = this.getNodeIds(nodes);
        var g = new graphlib.Graph();
        ids.forEach(function (id) {
            g.setNode(id);
        });
        var me = this;
        nodes.forEach(function (item) {
            if (me['dealNode' + item.type]) {
                me['dealNode' + item.type](g, item);
            } else {
                console.log('have no deal node of ' + item.type);
            }
        });
        var distance = graphlib.alg.dijkstra(g, 'Start');

        return this.generateDepth(distance);
    },
    generateDepth: function (deep) {
        var depth = [];
        Object.keys(deep).forEach(function (key) {
            var distance = deep[key].distance;
            if (!depth[distance]) {
                depth[distance] = [];
            }
            depth[distance].push(key);
        });
        return depth;
    },
    getNodeIds: function (nodes) {
        return nodes.map(function (item) {
            return item.id;
        });
    },
    setEdge: function name (g, from, to) {
        g.setEdge(from, to);
    }
};
var DataDraw = {
    deleteLine: function (conn) {
        if (confirm('确定删除所点击的链接吗？')) {
            if(conn.sourceId){
                var nextNode=$('#'+conn.sourceId).attr('data-nextNode') || '';
                var nextNodearr=[];
                if(nextNode!=''){
                    nextNodearr=nextNode.split(',');
                }
                if(nextNodearr.indexOf(conn.targetId)!=-1){
                    nextNodearr.splice($.inArray(conn.targetId,nextNodearr),1);
                }
                var datalis=nextNodearr.join(',');
                    /*targetId*/
                $('#'+conn.sourceId).attr('data-nextNode',datalis);
            }
            jsPlumb.detach(conn);
        }
    },
    getTemplate: function (node) {
        return 'tpl-' + node.type || 'tpl-audio';
    },
    computeXY: function (nodes) {
        var matrix = DataProcess.inputData(nodes);
        var base = {
            topBase: 50,
            topStep: 150,
            leftBase: 150,
            leftStep: 200
        };
        for (var i = 0; i < matrix.length; i++) {
            for (var j = 0; j < matrix[i].length; j++) {
                var key = matrix[i][j];
                var dest = nodes.find(function (item) {
                    return item.id === key;
                });
                dest.top = dest.top || base.topBase + i * base.topStep;
                dest.left = dest.left || base.leftBase + j * base.leftStep;
            }
        }
    },
    draw: function (nodes) {
        // 将Exit节点排到最后
        nodes.sort(function (a, b) {
            if (a.type === 'Exit') return 1;
            if (b.type === 'Exit') return -1;
            return 0;
        });
        this.computeXY(nodes);
        // var template = $('#tpl-demo').html()
        var $container = $(areaId);
        var me = this;
        nodes.forEach(function (item, key) {
            var sorce=(item.nextnode && item.nextnode.length>0)?item.nextnode.join(','):'';
            var data = {
                id: item.id,
                name: item.id,
                top: item.top,
                left: item.left,
                usemesg:{
                    id:item.id,
                    name:item.userName,
                    userNotes:item.userNotes
                },
                nextnode:sorce
            };
            var templateadd = me.getTemplate(item);
            var tempshow=template(templateadd, data);
            $container.append(tempshow);
            if (me['addEndpointOf' + item.type]) {
                me['addEndpointOf' + item.type](item);
            }
        });
        this.mainConnect(nodes);
    },
    mainConnect: function (nodes) {
        var me = this;
        nodes.forEach(function (item) {
            if (me['connectEndpointOf' + item.type]) {
                me['connectEndpointOf' + item.type](item);
            }
        });
    },
    connectEndpoint: function (from, to) {
        jsPlumb.connect({ uuids: [from, to] });
    },
    addEndpointOfaudio: function (node) {
        addDraggable(node.id);
        setEnterPoint(node.id);
        setExitPoint(node.id);
    },
    connectEndpointOfaudio:function(node){
        if(node.nextnode && node.nextnode.length>0){
            var data=node.nextnode;
            for (var i = 0; i <data.length ; i++) {
                this.connectEndpoint(node.id + '-out', data[i] + '-in');
            }
        }
    }
};