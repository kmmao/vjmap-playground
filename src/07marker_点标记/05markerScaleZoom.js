const { message } = antd; // 第三库用于消息提示
window.onload = async () => {
    const env = {
        serviceUrl: "https://vjmap.com/server/api/v1",
        accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJJRCI6MiwiVXNlcm5hbWUiOiJhZG1pbjEiLCJOaWNrTmFtZSI6ImFkbWluMSIsIkF1dGhvcml0eUlkIjoiYWRtaW4iLCJCdWZmZXJUaW1lIjo4NjQwMCwiZXhwIjo0ODEzMjY3NjM3LCJpc3MiOiJ2am1hcCIsIm5iZiI6MTY1OTY2NjYzN30.cDXCH2ElTzU2sQU36SNHWoTYTAc4wEkVIXmBAIzWh6M",
        exampleMapId: "sys_zp",
        assetsPath: "../../assets/",
        ...__env__ // 如果您已私有化部署，需要连接已部署的服务器地址和token，请打开js/env.js,修改里面面的参数
    };
    try {
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/marker/05markerScaleZoom
        // --随缩放级别缩小的点标记--
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
            zoom: 2, // 设置地图缩放级别
            renderWorldCopies: false // 不显示多屏地图
        });
        
        // 关联服务对象和投影对象
        map.attach(svc, prj);
        
        await map.onLoad();
        // 鼠标移动显示坐标位置控件
        map.addControl(new vjmap.MousePositionControl({showZoom: true}));
        
        const mapBounds = map.getGeoBounds(0.4);
        
        for(let i = 0; i < 5; i++) {
            let point = mapBounds.randomPoint(); // 生成一个随机点
            let markerEle = new vjmap.BreathingApertureMarker({
                lngLat: map.toLngLat(point),
                text: "唯杰地图"
            }, {
                width: 200,
                colors: [vjmap.randomColor(), vjmap.randomColor()],
                textColor: "#f00"
            })
            let marker = markerEle.createMarker({
                scaleMaxZoom: 3 // 设置能缩放的最大级别。如果小于这个级别，div将根据缩小级别自动缩小比例，当小于3级时，大小将自动缩放，大于3级时，将保存原样
            })
            marker.setAnimation("MAP_ANIMATION_DROP") // 坠落动画
            marker.addTo(map);
        
        // 上述代码等价于
            /*
            let markerEle = new vjmap.BreathingApertureMarker({
                lngLat: map.toLngLat(point),
                text: "唯杰地图"
            }, {
                width: 200,
                colors: [vjmap.randomColor(), vjmap.randomColor()],
                textColor: "#f00"
            })
        
            let marker = new vjmap.Marker({
                element: markerEle,
                color: vjmap.randomColor()
            });
            marker.setLngLat(markerEle.getLngLat()); // 坐标
            marker.setScaleMaxZoom(3); // 设置能缩放的最大级别。如果小于这个级别，div将根据缩小级别自动缩小比例，当小于3级时，大小将自动缩放，大于3级时，将保存原样
            marker.setAnimation("MAP_ANIMATION_BOUNCE") // 弹跳动画
            marker.addTo(map);
            */
        }
        message.info("请缩放地图，当小于3级时，div将根据缩小级别自动缩小比例，大于3级时，将保存原样")
        
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