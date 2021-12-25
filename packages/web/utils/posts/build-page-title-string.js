const buildPageTitleString = (postTitle, subdomain) => {
  const titleArray = [];
  if (postTitle) titleArray.push(postTitle);
  if (subdomain) titleArray.push(subdomain);
  titleArray.push("notes.site");
  return titleArray.join(" - ");
};

export default buildPageTitleString;
