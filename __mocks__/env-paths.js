// Mock for env-paths
module.exports = function envPaths(name, opts) {
  const paths = {
    data: `/mock/data/${name}`,
    config: `/mock/config/${name}`,
    cache: `/mock/cache/${name}`,
    log: `/mock/log/${name}`,
    temp: `/mock/temp/${name}`,
  };

  return paths;
};
