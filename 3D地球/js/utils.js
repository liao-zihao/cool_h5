/**
 * @desc 地图数据解析
*/
function filterData(data, radius) {
    let { features, type } = data;

    let countrys = {};
    // 全世界国家
    for (let ds of features) {
        let name = ds.properties.name;
        if (!countrys[name]) {
            countrys[name] = {};
        }

        // 坐标数组
        for (let i = 0; i < ds.geometry.coordinates.length; i++) {
            let ass = ds.geometry.coordinates[i];

            if (!countrys[name][i]) {
                countrys[name][i] = [];
            }
            if (ass.length === 1) {
                ass = ass[0];
            }
            // 图形坐标集合 ass
            for (let a of ass) {
                // 坐标 [x, y] a
                let pos = getPosition(a[0], a[1], radius);
                countrys[name][i].push(pos);
            }
        }
    }
    return countrys;
}

/**
 * @desc 绘制不规则的椎体
*/
function drawZT(dots, radius) {

    // 中心点
    var pointsAll = [new THREE.Vector3(0, 0, 0)];
    for (let d of dots) {
        pointsAll.push(d);
    }

    // 三点一面
    var vertices = []; // 顶点
    var indices = []; // 连线
    for (let i = 0; i < pointsAll.length; i++) {
        let d = pointsAll[i];
        // 点
        vertices.push(d.x);
        vertices.push(d.y);
        vertices.push(d.z);

        // 链接
        indices.push(0);
        indices.push(i);
        let k = i + 1;
        if (k > pointsAll.length - 1) {
            k = 0;
        }
        indices.push(k);
    }

    // 自由图形
    let box = new THREE.PolyhedronGeometry(vertices, indices, radius);
    // 绘制多面矩形
    let mesh = new THREE.Mesh(
        box,
        new THREE.MeshBasicMaterial({ color: '#ccc', side: THREE.DoubleSide, transparent: true })
    );
    mesh.material.opacity = 0.6;

    return mesh;
}

/**
 * @desc 设置随机颜色
*/
function getRandomColor() {
    return '#' + ('00000' + ((Math.random() * 16777215 + 0.5) >> 0).toString(16)).slice(-6);
}

/**
 * @desc 对象转换, vectorBSP
 * @param {array} [Vector3]
 * @return {bsp} arr, 需要使用 toMesh(material) 方法转换成mesh 方法
 * eg:
    let material = new THREE.MeshLambertMaterial({
        color: '#1f245f' // 颜色
    });
    let result = intersect2.toMesh(material);
    maps.add(result);
    material.transparent = true;
    result.material.opacity = 0.5;
    console.timeEnd('one');
*/
function mapVectorBSP(mesh, size, ext) {
    // console.time('all');
    var arr = [];
    let meshBsp = new ThreeBSP(mesh);

    // 再裁剪一次, 减去
    let geometry1 = new THREE.SphereGeometry(size, 50, 50);
    let bsp1 = new ThreeBSP(geometry1);
    let intersect1 = meshBsp.subtract(bsp1);

    // 裁剪一次， 求交
    let geometry2 = new THREE.SphereGeometry(size + ext, 50, 50);
    let bsp2 = new ThreeBSP(geometry2);
    let intersect2 = intersect1.intersect(bsp2);

    // console.timeEnd('all');
    return intersect2;
}

/**
 * @desc 经纬度转换成3D 坐标
 * @param lng, lat 经纬度
 * @param radius 半径
*/
function getPosition(lng, lat, radius) {
    let phi = (90 - lat) * (Math.PI / 180);
    let theta = (lng + 180) * (Math.PI / 180);

    let x = -(radius * Math.sin(phi) * Math.cos(theta));
    let z = (radius * Math.sin(phi) * Math.sin(theta));
    let y = (radius * Math.cos(phi));
    return new THREE.Vector3(x, y, z);
}

/**
 * @desc 已知两点向量，求中心点。向量的加减法
 * @param {Vector3} v1,v2
 * @return {Vector3}
 */
function getCenterVector(v1, v2) {
    let v = v1.add(v2);
    return v.divideScalar(2);
}

/**
 * @desc 获取两个向量之间的距离
*/
function getVectorLen(v1, v2) {
    let x = (v1.x - v2.x) * (v1.x - v2.x);
    let y = (v1.y - v2.y) * (v1.y - v2.y);
    let z = (v1.z - v2.z) * (v1.z - v2.z);
    return Math.sqrt(x + y + z);
}

/**
 * @desc 3d 法向量映射 3d 坐标转换成 2d 坐标
 */
function addNodeTo2D(item, camera, radius) {
    var position = getPosition(item.pos[0], item.pos[1], radius);
    var vector = new THREE.Vector3(position.x, position.y, position.z);
    vector = vector.project(camera);
    var halfWidth = winWth / 2;
    var halfHeight = winHgt / 2;
    var result = {
        x: Math.round(vector.x * halfWidth + halfWidth),
        y: Math.round(-vector.y * halfHeight + halfHeight)
    };
    return p;
}

/**
 * @desc 全国各省
*/
function getCity() {
    return ['台湾', '河北', '山西', '内蒙古', '辽宁', '吉林', '黑龙江', '江苏', '浙江', '安徽', '福建', '江西', '山东', '河南', '湖北', '湖南', '广东', '广西', '海南', '四川', '贵州', '云南', '西藏', '陕西', '甘肃', '青海', '宁夏', '新疆', '北京', '天津', '上海', '重庆', '香港', '澳门'];
}