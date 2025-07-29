import slugify from 'slugify';
const generateSlug = (name: string) => {
  return slugify(name, {
    lower: true,
    strict: true,
    remove: /[*+~.()'"!:@]/g,
  });
};

export { generateSlug };
