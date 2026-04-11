export function getX(coor){
    const [topStat, rightStat] = coor;
    return rightStat + 0.5 * topStat;
}
export function getY(coor){
    const [topStat, rightStat] = coor;
    return topStat;
}