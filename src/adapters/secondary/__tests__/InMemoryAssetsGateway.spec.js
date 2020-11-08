import { InMemoryAssetsGateway } from '../InMemoryAssetsGateway'

describe('InMemoryAssetsGateway', () => {
  let AssetsGateway

  describe('constructor', () => {
    it('should have 0 balance by default', () => {
      initializeTest()
      expect(AssetsGateway.assets).toEqual([{ symbol: 'usd', quantity: 0 }])
    })
  })

  describe('addAsset', () => {
    it('should add to balance', () => {
      initializeTest()
      AssetsGateway.addAsset({ symbol: 'usd', quantity: 500 })
      expect(AssetsGateway.assets).toEqual([{ symbol: 'usd', quantity: 500 }])
    })
    it('should add to balance', () => {
      initializeTest()
      AssetsGateway.addAsset({ symbol: 'usd', quantity: 500 })
      AssetsGateway.addAsset({ symbol: 'usd', quantity: 500 })
      expect(AssetsGateway.assets).toEqual([{ symbol: 'usd', quantity: 1000 }])
    })
    it('should add to balance', () => {
      initializeTest()
      AssetsGateway.addAsset({ symbol: 'btc', quantity: 500 })
      expect(AssetsGateway.assets).toEqual([
        { symbol: 'usd', quantity: 0 },
        { symbol: 'btc', quantity: 500 }
      ])
    })
  })

  describe('removeAsset', () => {
    it('should remove from balance', () => {
      initializeTest()
      AssetsGateway.removeAsset({ symbol: 'usd', quantity: 500 })
      expect(AssetsGateway.assets).toEqual([{ symbol: 'usd', quantity: -500 }])
    })
  })

  describe('openPosition', () => {
    it('should add new openPosition and update assets', () => {
      initializeTest([{ symbol: 'usd', quantity: 1000 }])

      const newPosition = {
        pair: { base: 'btc', quote: 'usd' },
        quantity: 0.05,
        buyingPrice: 10000
      }
      AssetsGateway.openPosition(newPosition)
      expect(AssetsGateway.assets).toEqual([
        { symbol: 'usd', quantity: 500 },
        { symbol: 'btc', quantity: 0.05 }
      ])
      expect(AssetsGateway.openPositions).toEqual([
        { ...newPosition, id: 'trade_1' }
      ])
    })

    it('should add asset to already existing position', () => {
      const assets = [{ symbol: 'usd', quantity: 1000 }]
      const openPositions = [
        {
          pair: { base: 'btc', quote: 'usd' },
          quantity: 0.05,
          buyingPrice: 10000
        }
      ]
      initializeTest(assets, openPositions)

      const addedPosition = {
        id: 'trade_1',
        pair: { base: 'btc', quote: 'usd' },
        quantity: 0.05,
        buyingPrice: 10000
      }
      AssetsGateway.openPosition(addedPosition)
      expect(AssetsGateway.assets).toEqual([
        { symbol: 'usd', quantity: 0 },
        { symbol: 'btc', quantity: 0.1 }
      ])
      expect(AssetsGateway.openPositions).toEqual([
        {
          id: 'trade_1',
          pair: { base: 'btc', quote: 'usd' },
          quantity: 0.1,
          buyingPrice: 10000
        }
      ])
    })
  })

  describe('closePosition', () => {
    it('should close position and update assets', () => {
      const assets = [{ symbol: 'usd', quantity: 1000 }]
      initializeTest(assets)
      AssetsGateway.openPosition({
        pair: { base: 'btc', quote: 'usd' },
        quantity: 0.05,
        buyingPrice: 10000
      })

      const closedPosition = {
        id: 'trade_1',
        pair: { base: 'btc', quote: 'usd' },
        quantity: 0.05,
        sellingPrice: 12000
      }
      AssetsGateway.closePosition(closedPosition)

      expect(AssetsGateway.assets).toEqual([
        { symbol: 'usd', quantity: 1100 },
        { symbol: 'btc', quantity: 0 }
      ])
      expect(AssetsGateway.openPositions).toEqual([])
      expect(AssetsGateway.closedPositions).toEqual([
        {
          id: 'trade_2',
          originalTradeId: 'trade_1',
          pair: { base: 'btc', quote: 'usd' },
          quantity: 0.05,
          buyingPrice: 10000,
          sellingPrice: 12000
        }
      ])
    })
    it('should partially close position and update assets', () => {
      const assets = [{ symbol: 'usd', quantity: 1000 }]
      initializeTest(assets)
      AssetsGateway.openPosition({
        pair: { base: 'btc', quote: 'usd' },
        quantity: 0.05,
        buyingPrice: 10000
      })

      const closedPosition = {
        id: 'trade_1',
        pair: { base: 'btc', quote: 'usd' },
        quantity: 0.01,
        sellingPrice: 14000
      }
      AssetsGateway.closePosition(closedPosition)

      expect(AssetsGateway.assets).toEqual([
        { symbol: 'usd', quantity: 640 },
        { symbol: 'btc', quantity: 0.04 }
      ])
      expect(AssetsGateway.openPositions).toEqual([
        {
          id: 'trade_1',
          pair: { base: 'btc', quote: 'usd' },
          quantity: 0.04,
          buyingPrice: 10000
        }
      ])
      expect(AssetsGateway.closedPositions).toEqual([
        {
          id: 'trade_2',
          originalTradeId: 'trade_1',
          pair: { base: 'btc', quote: 'usd' },
          quantity: 0.01,
          buyingPrice: 10000,
          sellingPrice: 14000
        }
      ])
    })
  })

  const initializeTest = (assets = [], positionsToOpen = []) => {
    AssetsGateway = new InMemoryAssetsGateway()
    assets.forEach(a => AssetsGateway.addAsset(a))
    positionsToOpen.forEach(p => AssetsGateway.openPosition(p))
  }
})
