const router = require('express').Router();
const { Product, Category, Tag, ProductTag } = require('../../models');

// The `/api/products` endpoint

// get all products
router.get('/', (req, res) => {
  Product.findAll({
    include: [
      Category, 
      {
       model: Tag,
      through: ProductTag,
      },
    ]})
    .then((products) => res.json(products))
    .catch((err) => {
      console.log(err);
      res.status(500).json(err);
  });
});

// get one product by id
router.get('/:id', (req, res) => {
 Product. findOne({
  where: {
    id: req.paramms.id,
  },
  indlue: [
    Category, 
    {
      model: Tag,
      throught: ProductTag, 
    },
  ],})
  .then((products) => res.json(products))
  .catch((err) => {
    console.log(err);
    res.status(500).json(err);
  });
});

// create new product
router.post('/', (req, res) => {
  const { product_name, price, stock, tagIds } = req.body;

  // Create the product with specified attributes
  Product.create({
    product_name,
    price,
    stock,
  })
    .then((product) => {
      // Check if there are product tags to associate
      if (tagIds && tagIds.length) {
        const productTagIdArr = tagIds.map((tag_id) => {
          return {
            product_id: product.id,
            tag_id,
          };
        });
        return ProductTag.bulkCreate(productTagIdArr)
          .then((productTagIds) => {
            res.status(200).json({ product, productTagIds });
          });
      } else {
        res.status(200).json(product);
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(400).json({error: 'Failed to create a new product' });
    });
});


// update product
router.put('/:id', (req, res) => {
  // update product data
  Product.update(req.body, {
    where: {
      id: req.params.id,
    },
  })
    .then((product) => {
      // find all associated tags from ProductTag
      return ProductTag.findAll({ where: { product_id: req.params.id } });
    })
    .then((productTags) => {
      // get list of current tag_ids
      const productTagIds = productTags.map(({ tag_id }) => tag_id);
      // create filtered list of new tag_ids
      const newProductTags = req.body.tagIds
        .filter((tag_id) => !productTagIds.includes(tag_id))
        .map((tag_id) => {
          return {
            product_id: req.params.id,
            tag_id,
          };
        });
      // figure out which ones to remove
      const productTagsToRemove = productTags
        .filter(({ tag_id }) => !req.body.tagIds.includes(tag_id))
        .map(({ id }) => id);

      // run both actions
      return Promise.all([
        ProductTag.destroy({ where: { id: productTagsToRemove } }),
        ProductTag.bulkCreate(newProductTags),
      ]);
    })
    .then((updatedProductTags) => res.json(updatedProductTags))
    .catch((err) => {
      // console.log(err);
      res.status(400).json(err);
    });
});

router.delete('/:id', (req, res) => {
  // delete one product by its `id` value
  Product.destroy({
    where: {
      id: req.params.id,
    },
  })
  .then(() => {
    res.status(200).end();
  })
  .catch((err) => {
    console.error(err);
    res.status(400).json(err);
  });
});

module.exports = router;
