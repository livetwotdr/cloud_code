const config = require('../config');
const stripe = require('stripe')(config.sk_key);

// Get in-app purchases created in Parse Server
Parse.Cloud.define("stripe_products", async (request) => {

  let products = await stripe.products.list({
    //limit: 3,
  });

  let parseProducts = [];
  

  for(let i = 0; i < products.data.length; i++) {

    let product = products.data[i];
    let prices = await stripe.prices.list({product: product.id});

    
    let productObject = {
      identifier: product.metadata.identifier,
      coins: product.metadata.coins != null ? parseInt(product.metadata.coins) : 0,
      days: product.metadata.days != null ? parseInt(product.metadata.days) : 0,
      feesPercent: parseInt(product.metadata.feesPercent),
      stripeProductId: product.id,
      name: product.name,
      description: product.description,
      image: product.images[0],
    };
  
    if (prices.data[0]) {
      productObject.priceId = prices.data[0].id;
      productObject.price = prices.data[0].unit_amount / 100; // Stripe prices are in the smallest currency unit (like cents)
      productObject.currency = prices.data[0].currency;

      if(prices.data[0].recurring != null){
        productObject.interval = prices.data[0].recurring.interval;
        productObject.interval_count = prices.data[0].recurring.interval_count;
      }
    }
  
    parseProducts.push(productObject);

  }

  return parseProducts;
});

// Stripe function for payment on web and mobile for extended license
Parse.Cloud.define("stripe_pay", async request => {
    
    var objectId = request.params.objectId;
    var amount = parseInt(request.params.amount);
    var feesPercent = request.params.feesPercent;
    var currency = request.params.currency;
    var description = request.params.description;
    var sku = request.params.sku;
    var credits = request.params.credits;
    var type = request.params.type;
  
    var fees = (amount / 100) * feesPercent;
    var amountToPay = amount + fees;
  
    var fullname = request.params.name;
    var email = request.params.email;
    
    let ephemeralKey;
    let customerId;
  
    var userQueryAuthor = new Parse.Query(Parse.User);
    userQueryAuthor.equalTo("objectId", objectId);
    const author = await userQueryAuthor.first({useMasterKey: true});
  
    if(author != null){
      customerId = author.get("stripe_customer_id");
      
      if(customerId != null){
        ephemeralKey = await stripe.ephemeralKeys.create({customer: customerId},{apiVersion: '2022-11-15'});
      } else {
  
        const customer = await stripe.customers.create({
          description: config.app_name + ' User ID: ' + objectId,
          name: fullname,
          email: email,
          metadata: {
            'objectId': objectId,
          },
        });
  
        customerId = customer.id;
  
        author.set("stripe_customer_id", customer.id);
        await author.save(null, {useMasterKey: true});
  
        ephemeralKey = await stripe.ephemeralKeys.create({customer: customerId},{apiVersion: '2022-11-15'});
      }
  
      const paymentIntent = await stripe.paymentIntents.create({
        amount: parseInt(amountToPay).toFixed(0), // Convert to fixed precision string
        currency: currency, //'eur' or 'usd'
        customer: customerId,
        description: description,
        metadata: {
          'sku': sku,
          'objectId': objectId,
          'description' : description,
          'coins' : credits,
          'type' : type, 
        },
        //confirm : true,
        capture_method : "automatic" ,
        automatic_payment_methods: {
          enabled: true,
        },
      });
  
      let paymentObject = {
        paymentIntent: paymentIntent.client_secret,
        ephemeralKey: ephemeralKey.secret,
        customer: customerId,
        publishableKey: config.pk_key,
       };
  
       return paymentObject;
      
    } else {
      console.info("author error");
    }
  
  });