module.exports = {
  /**
   * Returns back some attributes based on whether the
   * link is active or a parent of an active item
   *
   * @param {String} itemUrl The link in question
   * @param {String} pageUrl The page context
   * @returns {String} The attributes or empty
   */
  getLinkActiveState(itemUrl, pageUrl) {
    let response = '';

    // Exact match
    if (itemUrl === pageUrl) {
      response = ' aria-current="page"';
    }
    // Parent match (but not root "/" matching everything)
    else if (itemUrl !== '/' && pageUrl.startsWith(itemUrl)) {
      response = ' data-state="active"';
    }

    return response;
  },

  // ... keep the rest of your functions as they are
  getSiblingContent(collection, item, limit = 3, random = true) {
    let filteredItems = collection.filter(x => x.url !== item.url);

    if (random) {
      let counter = filteredItems.length;

      while (counter > 0) {
        // Pick a random index
        let index = Math.floor(Math.random() * counter);

        counter--;

        let temp = filteredItems[counter];

        // Swap the last element with the random one
        filteredItems[counter] = filteredItems[index];
        filteredItems[index] = temp;
      }
    }

    // Lastly, trim to length
    if (limit > 0) {
      filteredItems = filteredItems.slice(0, limit);
    }

    return filteredItems;
  },

  filterCollectionByKeys(collection, keys) {
    return collection.filter(x => keys.includes(x.data.key));
  }
};