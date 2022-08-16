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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/marker/15markerNoOverlap
        // --标记Marker聚合(重叠时只显示一个)--
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
        // 根据地图范围建立几何投影坐标系
        let prj = new vjmap.GeoProjection(res.bounds);
        
        // 地图对象
        let map = new vjmap.Map({
            container: 'map', // DIV容器ID
            style: svc.rasterStyle(), // 样式，这里是栅格样式
            center: prj.toLngLat(prj.getMapExtent().center()), // 设置地图中心点
            zoom: 2, // 设置地图缩放级别
            renderWorldCopies: false, // 不显示多屏地图
            doubleClickZoom: false // 不启用双击缩放
        });
        
        
        // 关联服务对象和投影对象
        map.attach(svc, prj);
        let mapBounds = map.getGeoBounds(0.4); // 得到地图地理范围
        // 随机生成点
        let data = [];
        for (let i = 0; i < 1000; i++) {
            data.push({
                point: mapBounds.randomPoint(),
                properties: {
                    index: i
                }
            })
        }
        let popupInfo = null;
        const getColor = (num) => {
            let color = "#00FFFF";
            if (num > 1) {
                //  可以用颜色来区分下，
                // 1-5个 绿色 #80FF00
                // 5-10个 黄色 #FFFF00
                // 10个以上 红色 #FF3D3D
                if (num <= 5) {
                    color = "#80FF00";
                } else  if (num <= 10) {
                    color = "#FFFF00";
                } else {
                    color = "#FF3D3D";
                }
            }
            return color
        }
        // 创建Marker回调，必须返回一个Marker或从Marker派生的对象
        // curMarkerData 当前要显示的marker的数据， clusterMarkersData 当前聚合的maker的数据，包括当前要显示的)
        const createMarker = (curMarkerData, clusterMarkersData)=> {
            let marker = new vjmap.Marker({
                color: getColor(clusterMarkersData.length)
            }).setLngLat(map.toLngLat(curMarkerData.point));
            // 给marker增加点击事件
            marker.on('click', (e) => {
                let html = `
                    ID: ${marker.clusterMarkersData[0].properties.index}<br/>
                `
                if (marker.clusterMarkersData.length > 1) {
                    html +=  `
                                            聚合内共有 <span style="color: red" >${marker.clusterMarkersData.length}</span> 个Marker<br/>
                                            请双击Marker查看显示所有的Marker
                                        `
                }
                if (!popupInfo) {
                    popupInfo = new vjmap.Popup({ closeOnClick: false, closeButton: true, anchor: "bottom" });
                } else {
                    popupInfo.remove()
                }
                popupInfo.setHTML(html)
                    .setLngLat(marker.getLngLat())
                    .setOffset([0, -30])
                    .addTo(map);
            });
            // 双击查看未显示的Marker
            marker.on('dblclick', (e) => {
                if (marker.clusterMarkersData.length <= 1)  return;
                let pts = marker.clusterMarkersData.map(c => c.point)
                let showBounds = vjmap.geoBounds();
                showBounds.update(pts); //得到所有点坐标的范围
                let lngLatBounds = map.toLngLat(showBounds);
                map.fitBounds(lngLatBounds, {
                    padding: 40 //旁边留几十个像素，方便全部看到
                });
                if (popupInfo) {
                    popupInfo.remove()
                    popupInfo = null;
                }
            })
            return marker;
        
        }
        // 更新Marker回调，如果返回空，则表示只更新Marker内容，如果返回了Marker对象，表示要替换之前的Marker对象
        // curMarkerData 当前要显示的marker的数据， clusterMarkersData 当前聚合的maker的数据，包括当前要显示的; marker当前的实例对象)
        const updateMarker = (curMarkerData, clusterMarkersData, marker)=> {
            marker.setColor(getColor(clusterMarkersData.length)) ;// 根据不同的聚合数修改颜色
        }
        let markerCluster = new vjmap.MarkerCluster({
            /** 数据内容.(传入坐标为CAD地理坐标) */
            data,
            // 创建Marker回调，必须返回一个Marker或从Marker派生的对象 (curMarkerData 当前要显示的marker的数据， clusterMarkersData 当前聚合的maker的数据，包括当前要显示的)
            createMarker,
            // 更新Marker回调，如果返回空，则表示只更新Marker内容，如果返回了Marker对象，表示要替换之前的Marker对象 (curMarkerData 当前要显示的marker的数据， clusterMarkersData 当前聚合的maker的数据，包括当前要显示的; marker当前的实例对象)
            updateMarker,
            /** 是否允许重叠，默认false. */
            allowOverlap: false,
            /** 允许重叠的最大缩放级别，小于或等于此级别才会处理重叠，超过此级时会全部显示当前所有的(如果不允许重叠时有效).默认4级*/
            allowOverlapMaxZoom: 4,
            /** marker div的像素宽，用于计算重叠时需要，默认40. 如果在data的properties设置了属性markerWidth，则以data设置的为准*/
            markerWidth: 28,
            /** marker div的像素高，用于计算重叠时需要，默认40. 如果在data的properties设置了属性markerHeight，则以data设置的为准 */
            markerHeight: 40,
            /** 离相机最近的在显示在前面，默认false. */
            cameraNearFront: true
        })
        
        markerCluster.addTo(map)
        
        
        const setOverlap = (isOverlap) => {
            markerCluster.allowOverlap(isOverlap);
        }
        // UI界面
        const App = () => {
            return (
                <div>
                    <div className="info w160">
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0" onClick={() => setOverlap(true)}>允许重叠</button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0" onClick={() => setOverlap(false)}>不允许重叠</button>
                        </div>
        
                    </div>
                </div>
            );
        }
        ReactDOM.render(<App />, document.getElementById('ui'));
        
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