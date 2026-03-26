export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePhone = (phone) => {
  return phone.length >= 10;
};

export const validateRequired = (value) => {
  return value && value.trim().length > 0;
};

export const validatePrice = (price) => {
  return !isNaN(price) && price > 0;
};