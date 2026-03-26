import { faker } from '@faker-js/faker';

export const generateProducts = (count = 20) => {
  return Array.from({ length: count }).map(() => {
    const stock = faker.number.int({ min: 0, max: 50 });
    return {
      id: faker.string.uuid(),
      name: faker.commerce.productName(),
      category: faker.commerce.department(),
      price: parseFloat(faker.commerce.price({ min: 100, max: 5000 })), // Adjusted for INR context
      stock: stock,
      sku: faker.string.alphanumeric(6).toUpperCase(),
      lowStockThreshold: 10,
      image: faker.image.urlLoremFlickr({ category: 'technics' }),
    };
  });
};

export const generateCustomers = (count = 15) => {
  return Array.from({ length: count }).map(() => {
    const totalSpent = parseFloat(faker.commerce.price({ min: 0, max: 150000 }));
    let tier = 'Regular';
    if (totalSpent > 100000) tier = 'Platinum';
    else if (totalSpent > 50000) tier = 'Gold';
    else if (totalSpent > 10000) tier = 'Silver';

    return {
      id: faker.string.uuid(),
      name: faker.person.fullName(),
      email: faker.internet.email(),
      phone: faker.phone.number(),
      totalSpent: totalSpent,
      tier: tier,
      joinDate: faker.date.past({ years: 2 }).toISOString(),
    };
  });
};

export const generateExpenses = (count = 10) => {
  return Array.from({ length: count }).map(() => ({
    id: faker.string.uuid(),
    category: faker.helpers.arrayElement(['Rent', 'Utilities', 'Inventory', 'Salaries', 'Marketing', 'Maintenance']),
    amount: parseFloat(faker.commerce.price({ min: 500, max: 20000 })),
    date: faker.date.recent({ days: 30 }).toISOString(),
    description: faker.lorem.sentence(),
    status: faker.helpers.arrayElement(['Approved', 'Pending']),
  }));
};

export const generateSales = (products, customers, count = 15) => {
  return Array.from({ length: count }).map(() => {
    const isPending = faker.datatype.boolean({ probability: 0.3 });
    const product = faker.helpers.arrayElement(products);
    const quantity = faker.number.int({ min: 1, max: 3 });
    const customer = faker.helpers.arrayElement([null, ...customers]); // Some sales are walk-ins

    return {
      id: faker.string.uuid(),
      customerId: customer ? customer.id : null,
      customerName: customer ? customer.name : 'Walk-in Customer',
      date: faker.date.recent({ days: 7 }).toISOString(),
      status: isPending ? 'pending' : 'completed',
      total: product.price * quantity,
      items: [
        {
          productId: product.id,
          productName: product.name,
          quantity: quantity,
          price: product.price
        }
      ]
    };
  });
};