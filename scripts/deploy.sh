if [ -d .git ]; then
  echo "Pulling latest release"
  git pull
else
  echo "Initializing git repository"
  git clone https://github.com/groc-prog/argus-bot.git
fi;

echo "Checking out latest tag"
tag=$(git describe --tags --abbrev=0)
git checkout $tag

commit=$(git rev-parse HEAD)
echo "Using tag $tag ($commit)"

echo "Installing dependencies"
bun install --production --frozen-lockfile

echo "Starting application"
bun run start


