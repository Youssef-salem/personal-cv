Assignment 3 - Portfolio Website with API Integration
Youssef Salem

Live website: https://youssef-salem.github.io/personal-cv/

Open index.html in a modern browser with JavaScript enabled and an internet
connection, or visit the live website. No installation or API key is needed.

The site preserves the Assignment 2 CV, theme toggle, skills disclosure,
project details, and validated contact form. The contact form validates
locally and opens an optional email draft; it does not send messages.

API integration
---------------
script.js uses fetch and async/await to request:
https://api.github.com/users/Youssef-salem/repos?sort=updated&direction=desc&per_page=6&type=owner

The live section displays up to six public repositories ordered by latest
update, including forks. Each card shows its name, description, language,
star count, and GitHub link. Missing descriptions/languages are identified
explicitly. View all repositories links to the full GitHub repository list.

A loading message is shown during requests. The Refresh button is disabled
while loading to prevent overlapping requests. Failed requests, rate limits,
invalid responses, and a 15-second timeout display errors with a retry button.
An empty response has a separate no-repositories message.

GitHub's unauthenticated API is rate-limited. If the limit is reached, wait
before retrying or use the GitHub profile link. No credentials are included.
The original CV and direct contact links remain available if the API fails.

Quick checks
------------
1. Open the page and confirm repository cards load from GitHub.
2. Refresh repositories and check the loading message and updated cards.
3. Block api.github.com or go offline in browser developer tools, then refresh.
   Confirm an error appears; restore access and use the retry button.
4. Toggle dark mode, hide/show skills, and expand project details.
5. Submit an empty contact form, an invalid email, then valid sample entries.
6. Check the page at desktop and phone widths.
