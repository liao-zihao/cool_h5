var earthImg = './earth.jpg'; // 
var cloudsImg = './clouds.jpg';

var container, stats, orbitControl;
var camera, scene, renderer;
var group, earth, maps;
var mouseX = 0, mouseY = 0;
var winWth = 0, winHgt = 0;
var globalData

var size = 600;

// 3点求面公式

// 地球
function globe() {

    // 中国地图
    $.get('./china.json', function (res) {
        // 数据过滤
        res = decode(res);
        // console.log(res);
        res.countrys = filterData(res, size + 4);

    }).then(function (res) {
        // console.log(res);
        globalData = res
        // console.log(globalData)

        let dotsMeshs = new THREE.Group();
        let linesMeshs = new THREE.Group();
        let ztMeshs = new THREE.Group();
        let citys = [];

        for (let country in res.countrys) { // country 是一个国家的坐标数组

            if (getCity().indexOf(country) !== -1) {
                for (let key in res.countrys[country]) { // dots 是一个国家里面的一个模块的坐标数组

                    let dots = res.countrys[country][key];

                    // 添加边缘线条
                    if (dots.length > 1) {
                        let curve = new THREE.CatmullRomCurve3(dots);
                        let geometry = new THREE.Geometry();
                        geometry.vertices = curve.getPoints(1000);
                        let mesh = new THREE.Line(
                            geometry,
                            new THREE.LineBasicMaterial({ color: '#ff0' })
                        );
                        linesMeshs.add(mesh);
                    }

                    // 添加拐点的点
                    dots.forEach(point => {
                        var spMesh = new THREE.Mesh(
                            new THREE.SphereGeometry(0.3),
                            new THREE.MeshBasicMaterial({ color: '#000' })
                        );
                        spMesh.position.set(point.x, point.y, point.z);
                        dotsMeshs.add(spMesh);
                    });

                    // 绘制椎体
                    if (dots.length > 5) {
                        let city = drawZT(dots, size + 20);
                        // console.log('>>>>>', city);
                        // citys.push(city);
                        ztMeshs.add(city);
                    }
                }
            }
        }

        maps.add(linesMeshs); // 添加轮廓
        // maps.add(dotsMeshs); // 添加拐点
        maps.add(ztMeshs); // 椎体

        // 对象转换
        setTimeout(function () {

            for (let i = 0; i < citys.length; i++) {
                let city = citys[i];
                var bsp = mapVectorBSP(city, size, 12);
                let material = new THREE.MeshLambertMaterial({
                    color: getRandomColor(), // 颜色
                    transparent: true,
                    opacity: 0.2
                });
                let result = bsp.toMesh(material);
                result.geometry.computeVertexNormals();
                maps.add(result);
            }
        }, 1000);

        // 添加点
        var wuhanIndex = getCity().indexOf('湖北')
        var res = [
            { pos: globalData.features[wuhanIndex].properties.cp },
            // { pos: [110.023281, 18.95424] },
            // { pos: [104.060258, 30.61749] },
            // { pos: [120.303386, 30.87268] }
        ];
        // console.log(globalData)
        globalData.features.forEach((d,i)=>{
            if(i!==wuhanIndex){
                res.push({pos:d.properties.cp})
            }
        })
        // console.log(res[0])
        for (let d of res) {
            // console.log(d)
            addPlane(d);
        }
        // console.log(res)
        var p0 = res[0].position;
        for (let i = 1; i < res.length; i++) {
            let p = res[i].position;
            // 添加贝塞尔曲线
            let curve = addBSELine(p0, p);
            addLightPoint(curve.getPoints(100));
        }
    });

    // 添加地球
    var texture = new THREE.TextureLoader().load(earthImg);
    var globeGgeometry = new THREE.SphereGeometry(size, 50, 50);
    var globeMaterial = new THREE.MeshPhongMaterial({
        map: texture,
        transparent: true,
        opacity: 0.4,
        // color: '#ae60f0',
        // side: THREE.DoubleSide
        // wireframe: true
    });
    var globeMesh = new THREE.Mesh(globeGgeometry, globeMaterial);
    earth.add(globeMesh);
}

// 云
function clouds() {
    var texture = new THREE.TextureLoader().load(cloudsImg);
    var globeGgeometry = new THREE.SphereGeometry(size + 4, 100, 100);
    var globeMaterial = new THREE.MeshStandardMaterial({ alphaMap: texture });
    var globeMesh = new THREE.Mesh(globeGgeometry, globeMaterial);
    globeMaterial.transparent = true;
    globeMesh.material.opacity = 0.6;
    group.add(globeMesh);
}

// 星点
function stars() {
    var starsGeometry = new THREE.Geometry();
    for (var i = 0; i < 1000; i++) {
        var starVector = new THREE.Vector3(
            THREE.Math.randFloatSpread(1200),
            THREE.Math.randFloatSpread(1200),
            THREE.Math.randFloatSpread(1200)
        );
        starsGeometry.vertices.push(starVector);
    }
    var starsMaterial = new THREE.PointsMaterial({ color: '#ffffff', size: 0 });
    var starsPoint = new THREE.Points(starsGeometry, starsMaterial);
    group.add(starsPoint);
}

// 光
function lights() {
    var hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x333333, 2);
    hemisphereLight.position.x = 0;
    hemisphereLight.position.y = 0;
    hemisphereLight.position.z = -size;
    earth.add(hemisphereLight);
}

// 动画
function animate() {
    requestAnimationFrame(animate);
    group.rotation.y -= 0.0005;
    orbitControl.update();
    renderer.render(scene, camera);
    stats.update();
}

// 辅助线
function drawHelper() {
    // 添加辅助面
    var clipPlanes = [
        new THREE.Plane(new THREE.Vector3(1, 0, 0), 0),
        new THREE.Plane(new THREE.Vector3(0, - 1, 0), 0),
        new THREE.Plane(new THREE.Vector3(0, 0, - 1), 0)
    ];
    var helpers = new THREE.Group();
    helpers.add(new THREE.PlaneHelper(clipPlanes[0], 1000, 0xff0000));
    helpers.add(new THREE.PlaneHelper(clipPlanes[1], 1000, 0x00ff00));
    helpers.add(new THREE.PlaneHelper(clipPlanes[2], 1000, 0x0000ff));
    helpers.visible = false;
    earth.add(helpers);
}

// 绘制贝塞尔曲线
function addBSELine(p1, p2) {
    // 获取中心点
    var vcenter = getCenterVector(
        new THREE.Vector3(p1.x, p1.y, p1.z),
        new THREE.Vector3(p2.x, p2.y, p2.z)
    );

    // 绘制射线
    var rayLine = new THREE.Ray(
        new THREE.Vector3(0, 0, 0),
        vcenter);
    var k = getVectorLen(p1, p2);
    var p3 = rayLine.at(Math.sqrt(1 + k / 200));

    // 绘制射线点, 也就是贝塞尔的中间点
    // var planeGeometry = new THREE.SphereGeometry(3, 20, 20);
    // var planeMaterial = new THREE.MeshPhongMaterial({
    //     color: '#f00', side: THREE.DoubleSide,
    //     depthTest: true
    // });
    // var plane = new THREE.Mesh(planeGeometry, planeMaterial);
    // plane.position.set(p3.x, p3.y, p3.z);
    // earth.add(plane);

    // 绘制贝塞尔曲线
    var curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(p1.x, p1.y, p1.z),
        new THREE.Vector3(p3.x, p3.y, p3.z),
        new THREE.Vector3(p2.x, p2.y, p2.z)
    );

    // 渲染线
    var geometry = new THREE.Geometry();
    geometry.vertices = curve.getPoints(100);
    var curveObject = new THREE.Line(
        geometry,
        new THREE.LineBasicMaterial({
            color: '#f0f',
            transparent: true,
            opacity: 0.4
        })
    );
    earth.add(curveObject);

    return curve;
}

// 点动画 pos: 开始位置，verArr 坐标点
function addLightPoint(verArr) {
    var pos = verArr[0];
    // 添加点
    var group = new THREE.Group();
    var len = 100; // 粒子长度
    for (let i = 0; i < len; i++) {

        let pg = new THREE.SphereGeometry(1.2, 3, 3);
        let pm = new THREE.MeshBasicMaterial({
            color: '#f0f',
            transparent: true,
            opacity: 1 - (1 / len) * i
        });

        let m = new THREE.Mesh(pg, pm);
        m.position.set(pos.x, pos.y, pos.z);
        group.add(m);
    }
    maps.add(group);

    let i = 0; // 数组下标
    let margin = 1; // 每两个点间隔5个点。速度
    let glen = group.children.length; // 粒子点
    function pointAnimate() {
        if (i >= verArr.length + (glen - 1) * margin) {
            i = 0;
        }
        let k = 0;
        for (let j = 0; j < glen; j++) {
            let num = i + k;
            k -= margin;
            if (num >= 0 && num < verArr.length) {
                let m = group.children[j];
                // 执行动画
                m.position.set(verArr[num].x, verArr[num].y, verArr[num].z);
            }
        }
        i++;
        requestAnimationFrame(pointAnimate);
    }
    pointAnimate();
}

// 添加标记
function addPlane(item) {
    var planeGeometry = new THREE.SphereGeometry(3, 20, 20);
    var planeMaterial = new THREE.MeshPhongMaterial({ color: 0x0FB4DD, side: THREE.DoubleSide, depthTest: true });
    if (item.pos[0] && item.pos[1]) {
        // console.log(item);
        var plane = new THREE.Mesh(planeGeometry, planeMaterial);
        // console.log('plane', plane)
        // 旋转
        plane.rotation.z = THREE.Math.degToRad(0);
        // 定位
        var position = getPosition(item.pos[0], item.pos[1], size + 1);
        plane.position.set(position.x, position.y, position.z);
        item.position = position;
        plane.type = 'plane';
        // 显示/隐藏
        // plane.visible = false;
        // 添加到场景
        maps.add(plane);
    }
}

function mouseEvent() {
    var mouse = new THREE.Vector2();
    var SELECTED, raycaster = new THREE.Raycaster();
    renderer.domElement.addEventListener('click', function (event) {
        // console.log(event);
        event.preventDefault();
        // 转化raycaster的角度和camrea的角度一样。
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(mouse, camera); // 设置相机射线
        // console.log('maps >>', maps);

        // 清空color
        maps.children.forEach(elem => {
            if (elem.material) {
                elem.material.opacity = 0.5;
            }
        });

        // 设置input
        // 获取点击的对象
        var intersects = raycaster.intersectObjects(maps.children);
        // console.log('intersects >> ', intersects);
        if (intersects.length > 0) {
            SELECTED = intersects[0].object;
            // console.log(SELECTED);
            SELECTED.material.opacity = 1;
        }
    }, true);
}

// 初始化
function init() {
    container = document.getElementById('earth3D');
    // size = container.clientHeight;
    winWth = container.clientWidth;
    winHgt = container.clientHeight;

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, winWth / winHgt, 1, 4000);
    camera.up.x = 0;
    camera.up.y = 1;
    camera.up.z = 0;
    var n = 455; // 相机距离
    camera.position.x = -n * 1;
    camera.position.y = n * 2;
    camera.position.z = -n * 3;
    camera.lookAt(0, 0, 0);

    // 分组
    group = new THREE.Group();
    earth = new THREE.Group();
    maps = new THREE.Group();

    // 地球    
    globe();
    clouds();

    // 星点
    stars();

    // 半球光
    lights();

    scene.add(earth);
    scene.add(group);
    scene.add(maps);



    // 渲染器
    renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        preserveDrawingBuffer: true
    });
    container.appendChild(renderer.domElement);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(winWth, winHgt);
    renderer.localClippingEnabled = true;
    // renderer.render(scene, camera);

    // 盘旋控制
    orbitControl = new THREE.OrbitControls(camera, renderer.domElement);
    orbitControl.minDistrance = 20;
    orbitControl.maxDistrance = 50;
    // orbitControl.enableZoom = false;
    // orbitControl.enablePan = false; // 拖动
    orbitControl.maxPolarAngle = Math.PI / 2;

    // 性能测试
    stats = new Stats();
    $('body').append(stats.dom);

    // resize事件
    // window.addEventListener('resize', onWindowResize, false);

    // 鼠标事件
    mouseEvent();

    animate();

}