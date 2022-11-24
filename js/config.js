var visoConfig = {};
visoConfig.connectorPaintStyle = {
    lineWidth: 1,
    strokeStyle: '#4caf50',
    joinstyle: 'round',
    fill: 'pink',
    outlineColor: '',
    outlineWidth: ''
}

// 鼠标悬浮在连接线上的样式
visoConfig.connectorHoverStyle = {
    lineWidth: 2,
    strokeStyle: 'red',
    outlineWidth: 10,
    outlineColor: ''
}

visoConfig.baseStyle = {
    endpoint: ['Dot', {
        radius: 8,
        fill: '#ff5722'
    }], // 端点的形状
    connectorStyle: visoConfig.connectorPaintStyle, // 连接线的颜色，大小样式
    connectorHoverStyle: visoConfig.connectorHoverStyle,
    paintStyle: {
        fillStyle: '#4caf50',
        radius: 6
        // lineWidth: 0
    }, // 端点的颜色样式
    hoverPaintStyle: {
        fillStyle: 'red',
        strokeStyle: 'red'
    },
    isSource: true, // 是否可以拖动（作为连线起点）
    connector: ['Flowchart', {
        gap: 0,
        cornerRadius: 5,
        alwaysRespectStubs: true
    }], // 连接线的样式种类有[Bezier],[Flowchart],[StateMachine ],[Straight ]
    isTarget: true, // 是否可以放置（连线终点）
    maxConnections: -1, // 设置连接点最多可以连接几条线
    connectorOverlays: [
        ['Arrow', {
            width: 10,
            length: 10,
            location: 1
        }],
        ['Label', {
            label: '',
            cssClass: '',
            labelStyle: {
                color: 'red'
            },
            events: {
                click: function (labelOverlay, originalEvent) {
                    console.log('click on label overlay for :' + labelOverlay.component)
                    console.log(labelOverlay)
                    console.log(originalEvent)
                }
            }
        }]
    ]
}