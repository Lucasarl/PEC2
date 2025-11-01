"use strict";
/***/
let myHangar = {};
myHangar['123Z'] = {
    model: 'airbus',
    npassengers: 200
};
myHangar['H789'] = {
    model: 'boeing',
    npassengers: 151
};
/** Print following lines (going through the object)
 * 123Z:airbus(200)
 * H789:boeing(151)
 */
for (let key in myHangar) {
    console.log(`${key}:${myHangar[key].model}(${myHangar[key].npassengers})`);
}
