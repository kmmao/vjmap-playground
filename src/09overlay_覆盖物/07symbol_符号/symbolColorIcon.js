const { message } = antd; // 第三库用于消息提示
window.onload = async () => {
    const env = {
        serviceUrl: "https://vjmap.com/server/api/v1",
        accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJJRCI6MiwiVXNlcm5hbWUiOiJhZG1pbjEiLCJOaWNrTmFtZSI6ImFkbWluMSIsIkF1dGhvcml0eUlkIjoiYWRtaW4iLCJCdWZmZXJUaW1lIjo4NjQwMCwiZXhwIjo0ODEzMjY3NjM3LCJpc3MiOiJ2am1hcCIsIm5iZiI6MTY1OTY2NjYzN30.cDXCH2ElTzU2sQU36SNHWoTYTAc4wEkVIXmBAIzWh6M",
        exampleMapId: "sys_zp",
        assetsPath: "../../../assets/",
        ...__env__ // 如果您已私有化部署，需要连接已部署的服务器地址和token，请打开js/env.js,修改里面面的参数
    };
    try {
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/overlay/symbol/symbolColorIcon
        // --颜色随状态值变化的符号图标--
        // 地图服务对象
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        // 打开地图
        let res = await svc.openMap({
            mapid: env.exampleMapId, // 地图ID
            mapopenway: vjmap.MapOpenWay.GeomRender, // 以几何数据渲染方式打开
            style: vjmap.openMapDarkStyle() // div为深色背景颜色时，这里也传深色背景样式
        })
        if (res.error) {
            // 如果打开出错
            message.error(res.error)
        }
        // 获取地图范围
        let mapExtent = vjmap.GeoBounds.fromString(res.bounds);
        // 根据地图范围建立几何投影坐标系
        let prj = new vjmap.GeoProjection(mapExtent);
        
        // 地图对象
        let map = new vjmap.Map({
            container: 'map', // DIV容器ID
            style: svc.rasterStyle(), // 样式，这里是栅格样式
            center: prj.toLngLat(mapExtent.center()), // 设置地图中心点
            zoom: 2, // 设置地图缩放级别,
            renderWorldCopies: false // 不显示多屏地图
        });
        
        // 关联服务对象和投影对象
        map.attach(svc, prj);
        // 根据地图本身范围缩放地图至全图显示
        map.fitMapBounds();
        await map.onLoad();
        
        const mapBounds = map.getGeoBounds(0.6);
        const geoDatas = []
        for(let i = 0; i < 50; i++) {
            const pt = mapBounds.randomPoint();
            const data = {
                point: map.toLngLat(pt),
                properties: {
                    name:  `ID:${i + 1}`,
                    status: i % 2 === 0 ? "normal" : "warn"
                }
            }
            geoDatas.push(data);
        }
        // 图标
        // 能设置颜色的symbol，需满足以下条件 (1)图标颜色纯色 (2)加载图片时使用参数 sdf 设置为true (3)设置 iconColor颜色值 可以直接设置一个颜色或使用表达式
        await map.loadImageEx("colorSymbol", env.assetsPath + "images/sensor4.png", {sdf: true});
        const symbols = new vjmap.Symbol({
            data: geoDatas,
            iconImage: "colorSymbol",
            iconColor: [
                'match',  // 匹配状态值
                ['get', 'status'],
                "normal",
                "#00ff00",
                "warn",
                "#ffff00",
                "alarm",
                "#ff0000",
                "#0000ff" // 其余种类以外的颜色
            ],
            iconOffset: [0, -34],
            textField: ['get', 'name'],
            textFont: ['Arial Unicode MS Regular'],
            textSize: 14,
            textColor: '#FFA0FD',
            textOffset: [0, 0.5],
            textAnchor: 'top',
            iconAllowOverlap: true,
            textAllowOverlap: true
        });
        symbols.addTo(map);
        
        // 模拟数据状态变化
        setInterval(() => {
            let data = symbols.getData();
            let idx = vjmap.randInt(0, data.features.length - 1);
            // 模拟某一条报警
            data.features[idx].properties.status = 'alarm'; // 修改数据属性
            symbols.setData(data); //修改数据
        }, 3000)
        
    }
    catch (e) {
        console.error(e);
        message.error({
            content: "catch error: " + (e.message || e.response || JSON.stringify(e).substr(0, 80)),
            duration: 60,
            key: "err"
        });
    }
};