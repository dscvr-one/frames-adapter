module.exports = {
  installCommand: () => 'npm ci --prefer-offline --no-audit',
  buildCommand: () => 'npm run build',
  beforePublish: ({exec}) => exec('npm config set "//npm.pkg.github.com/:_authToken" "\${GITHUB_TOKEN}"'),
  publishCommand: ({ defaultCommand, tag }) =>
    `${defaultCommand} --access public`,
};
