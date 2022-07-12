# Building a Release

Only maintainers who have push access to the official repository may build a release. 

1. Increment the version in `package.json`.
2. Increment the version and update time in `src/plugin.json`.
3. Add a changelog in `CHANGELOG.md` under the header for the new version.
4. Commit and push your changes to the main branch.
5. `git tag -a v<NEW_VERSION>`
6. `git push origin v<NEW_VERSION>`
7. Once the release is ready, move the release out of drafts by editing the release on Github. 
