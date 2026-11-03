import historicalProducts from './catalog.json' with { type: 'json' };

// Historical prices remain in the source archive, never in rendered HTML or island props.
export default historicalProducts.map(({ price, maxPrice, editions, ...product }) => ({
  ...product,
  editions: editions.map(({ price, ...edition }) => edition),
}));
