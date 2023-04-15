# sandelpoker
Calculate which cards to keep in GBF poker, as well as which cards to pick during 2-card high/low. This does not modify anything in GBF, but use at your own risk.

Heavily inspired by https://chrome.google.com/webstore/detail/gbf-poker-helper/cihlfiablcjbjlkkjeoffllogieggbgm.
I also wanted to know which cards were optimal to keep in the original hand.

Like the GBF poker helper extension, you activate this by going into developer tools and finding the "Sandel Poker" panel.
Since my method for finding the optimal set of cards to keep is "iterate through all the possibilities", it's inefficient. Correctness is also not guaranteed :)

The first row shows the cards that will give you the highest probability of winning, while the second shows the cards that will give you the highest expected winnings (assuming you're using a 1000-chip bet). These are not always the same!

To use, download the folder and "load unpacked extension" in `chrome://extensions`.

Would highly appreciate pull requests to clean up the code, make it faster, etc.! This is my first time making a Chrome extension and using Javascript so I'm sure it's extremely inelegant and inefficient.
