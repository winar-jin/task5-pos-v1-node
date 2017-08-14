const database = require('../main/database');

module.exports = function main(inputs) {
    let itemsInfo = [];
    let promotionsInfo = [];
    let handelCodes = formatCodes(inputs);
    handelCodes.forEach(itemCode => {
        let itemInfo = originItemInfo(itemCode);
        itemsInfo.push(itemInfo);
    });
    itemsInfo.forEach(item => {
        promotionItemInfo(item) ? promotionsInfo.push(promotionItemInfo(item)) : null;
    });
    let inventoryString = printInventery(itemsInfo,promotionsInfo);
    console.log(inventoryString);
};

function printInventery(itemsInfo,promotionsInfo) {
    let inventoryString = '***<没钱赚商店>购物清单***\n';
    let promotionAmount = 0;
    let originAmount = 0;
    itemsInfo.forEach(item => {
        originAmount += item.itemAmount;
        if (promotionsInfo.some(promotion => promotion.barcode === item.barcode)) {
            let promotionInfo = promotionsInfo.filter(promotion => promotion.barcode === item.barcode);
            inventoryString += `名称：${promotionInfo[0].name}，数量：${promotionInfo[0].quantity}${promotionInfo[0].unit}，单价：${promotionInfo[0].price.toFixed(2)}(元)，小计：${promotionInfo[0].itemAmount.toFixed(2)}(元)\n`;
        } else {
            inventoryString += `名称：${item.name}，数量：${item.quantity}${item.unit}，单价：${item.price.toFixed(2)}(元)，小计：${item.itemAmount.toFixed(2)}(元)\n`;
        }
    });
    inventoryString += '----------------------\n';
    inventoryString += '挥泪赠送商品：\n';
    promotionsInfo.forEach(item => {
        inventoryString += `名称：${item.name}，数量：${item.promotionQuantity}${item.unit}\n`;
        promotionAmount += item.price * item.promotionQuantity;
    });
    inventoryString += '----------------------\n';
    inventoryString += `总计：${(originAmount-promotionAmount).toFixed(2)}(元)\n`;
    inventoryString += `节省：${promotionAmount.toFixed(2)}(元)\n`;
    inventoryString += '**********************';
    return inventoryString;
}

function formatCodes(inputs) {
    let itemMap = {};
    let itemCodes = [];
    inputs.forEach(item => {
        if (item.split('-')[1] !== undefined) {
            itemMap[item.split('-')[0]] = item.split('-')[1];
        } else {
            itemMap[item] = itemMap[item] ? ++itemMap[item] : 1;
        }
    });
    for (let key in itemMap) {
        itemCodes.push(`${key}-${itemMap[key]}`);
    }
    return itemCodes;
}

function originItemInfo(itemCode) {
    const allItems = database.loadAllItems();
    const [brcode, quantity] = itemCode.split('-');
    let itemInfo = null;
    allItems.forEach(item => {
        if (item.barcode === brcode) {
            itemInfo = {
                'barcode': item.barcode,
                'unit': item.unit,
                'name': item.name,
                'quantity': quantity ? parseInt(quantity, 10) : 1,
                'price': item.price,
                'itemAmount': item.price * parseInt(quantity, 10)
            };
        }
    });
    return itemInfo;
}

function promotionItemInfo(itemInfo) {
    let promotionInfo = JSON.parse(JSON.stringify(itemInfo));
    const promotionsInfo = database.loadPromotions();
    const promotionStrategies = {
        'BUY_TWO_GET_ONE_FREE': promotionInfo => {
            const promotionQuantity = Math.floor(promotionInfo.quantity / 3);
            promotionInfo.promotionQuantity = promotionQuantity;
            promotionInfo.itemAmount -= promotionQuantity * promotionInfo.price;
            return promotionInfo;
        },
    };
    promotionsInfo.forEach(promotion => {
        if (promotion.barcodes.includes(promotionInfo.barcode)) {
            promotionInfo = promotionStrategies[promotion.type](promotionInfo);
        } else {
            promotionInfo = null;
        }
    });
    return promotionInfo;
}