function* iterator() {
  let index = 1
  while (true) yield index++
}

function idMaker(prefix) {
  const gen = iterator()
  return () => `${prefix}${gen.next().value}`
}

export class InMemoryAssetsGateway {
  constructor() {
    this.makeId = idMaker('trade_')
    this.baseCurrency = 'usd'
    this.assets = [{ symbol: this.baseCurrency, quantity: 0 }]
    this.openPositions = []
    this.closedPositions = []
  }

  addAsset(addedAsset) {
    const asset = this.assets.find(a => a.symbol === addedAsset.symbol)
    if (asset !== undefined) {
      const index = this.assets.indexOf(asset)
      this.assets = [
        ...this.assets.slice(0, index),
        { ...asset, quantity: asset.quantity + addedAsset.quantity },
        ...this.assets.slice(index + 1)
      ]
    } else {
      this.assets = [...this.assets, addedAsset]
    }
  }

  removeAsset(removedAsset) {
    this.addAsset({ ...removedAsset, quantity: -removedAsset.quantity })
  }

  openPosition(newPosition) {
    this.removeAsset({
      symbol: newPosition.pair.quote,
      quantity: newPosition.quantity * newPosition.buyingPrice
    })
    this.addAsset({
      symbol: newPosition.pair.base,
      quantity: newPosition.quantity
    })
    const { openPosition, openIndex } = this.getOpenPositionFromId(
      newPosition.id
    )
    if (this.haveSameId(openPosition, newPosition)) {
      this.updateOpenPosition(openIndex, {
        ...openPosition,
        quantity: openPosition.quantity + newPosition.quantity
      })
    } else {
      this.openPositions = [
        ...this.openPositions,
        { ...newPosition, id: this.makeId() }
      ]
    }
  }

  closePosition(closedPosition) {
    this.removeAsset({
      symbol: closedPosition.pair.base,
      quantity: closedPosition.quantity
    })
    this.addAsset({
      symbol: closedPosition.pair.quote,
      quantity: closedPosition.quantity * closedPosition.sellingPrice
    })
    const { openPosition, openIndex } = this.getOpenPositionFromId(
      closedPosition.id
    )
    if (this.isPartialClose(closedPosition, openPosition)) {
      this.updateOpenPosition(openIndex, {
        ...openPosition,
        quantity: openPosition.quantity - closedPosition.quantity
      })
      this.addClosedPosition({
        ...openPosition,
        ...closedPosition,
        originalTradeId: openPosition.id,
        id: this.makeId()
      })
    } else {
      this.removeOpenPosition(openIndex)
      this.closedPositions = [
        ...this.closedPositions,
        {
          ...openPosition,
          ...closedPosition,
          originalTradeId: openPosition.id,
          id: this.makeId()
        }
      ]
    }
  }

  getOpenPositionFromId(id) {
    const openPosition = this.openPositions.find(p => p.id === id)
    const openIndex = this.openPositions.indexOf(openPosition)
    return { openPosition, openIndex }
  }

  haveSameId(a, b) {
    return a?.id ? a?.id === b?.id : false
  }

  isPartialClose(closedPosition, openPosition) {
    return closedPosition.quantity !== openPosition.quantity
  }

  updateOpenPosition(index, position) {
    this.openPositions = [
      ...this.openPositions.slice(0, index),
      position,
      ...this.openPositions.slice(index + 1)
    ]
  }

  removeOpenPosition(index) {
    this.openPositions = [
      ...this.openPositions.slice(0, index),
      ...this.openPositions.slice(index + 1)
    ]
  }

  addClosedPosition(closedPosition) {
    this.closedPositions = [...this.closedPositions, closedPosition]
  }
}
