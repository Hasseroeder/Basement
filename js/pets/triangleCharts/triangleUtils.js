export function getX(coor){
    const [topStat, rightStat] = coor;
    return rightStat + 0.5 * topStat;
}
export function getY(coor){
    const [topStat, rightStat] = coor;
    return topStat;
}

function getPosition(leftAttr, rightAttr, bottomAttr){
    const sum = [...leftAttr, ...rightAttr, ...bottomAttr]
        .reduce((acc, num) => acc + num, 0);
    const right = 100 * (rightAttr.reduce((acc, num) => acc + num, 0)) / sum;
    const left = 100 * (leftAttr.reduce((acc, num) => acc + num, 0)) / sum;
    return [left, right];
}

function handleDataPoints(data) {
    return data.array.map(pet => {
        const imgEl = new Image();
        imgEl.src = pet.image;
        imgEl.height = data.imageSize.height;
        imgEl.width = data.imageSize.width;
        const coor = getPosition(
            data.attributeGroups.left.map(i => pet.attributes[i]),
            data.attributeGroups.right.map(i => pet.attributes[i]),
            data.attributeGroups.bottom.map(i => pet.attributes[i])
        );

        return {
            x: getX(coor),
            y: getY(coor),
            label: pet.name,
            imageEl: imgEl,
            attributes: pet.attributes,
        };
    });
}

export function buildTriangleDataset(dataSetConfig){
    return {
        data: handleDataPoints(dataSetConfig),
        pointStyle: ctx => ctx.raw.imageEl,
        radius: dataSetConfig.radius,
        hoverRadius: dataSetConfig.hoverRadius,
        hidden: false,
        clip: false
    };
}
