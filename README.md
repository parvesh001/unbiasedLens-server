# WELCOME TO UNBIASED LENS WEB APP SERVICE

Welcome to Unbiased Lens Blog Web Service, a powerful and feature-rich web service designed to provide an exceptional blogging experience. Built primarily with Node.js, Express, and Mongoose, along with additional packages like JSON Web Token, bcrypt, Express Validator, Multer, Sharp, and @aws-sdk/client-s3. Unbiased Lens offers a comprehensive set of functionalities to support your blogging journey.

Note: The frontend code for this web service is available in a separate repository. You can find it at (https://github.com/parvesh001/unbiasedLens-client). To use the web service, make sure to set up and run the frontend code as well. Refer to the frontend repository for instructions on installing and running the frontend application.

## Table of Contents

- [Introduction](#introduction)
- [Features](#features)
- [Installation](#installation)
- [Technologies Used](#technologies-used)
- [Contributing](#contributing)

## Introduction
Unbiased Lens Web Service is a versatile platform that empowers bloggers to create, manage, and share their content with ease. It offers a range of essential features, including authentication, authorization, error handling, and more, to ensure a secure and seamless user experience.

## Features
- Authentication and Authorization: Securely register, log in, and authenticate users with JSON Web Tokens. Protect your blog content and ensure authorized access to specific functionalities.

- Error Handling: Comprehensive error handling mechanisms to provide informative and user-friendly error messages, enhancing the overall user experience.

- Follow and Unfollow: Establish connections within the blogging community by following and unfollowing authors. Stay updated with their latest posts and engage in meaningful discussions.

- Profile Insights: Keep track of who viewed your profile, monitor your followers, and manage the authors you follow. Gain insights into your blog's reach and impact.

- Blog Post Management: Effortlessly create, delete, and update blog posts. Tailor your posts to captivate your audience.

- Post Interactions: Allow readers to engage with your posts through likes, dislikes, comments, and views. Foster a vibrant community by encouraging discussions and feedback.

- File Storage and Performance: Leverage the power of AWS services, specifically Amazon S3, to store and serve files such as profile pictures efficiently, ensuring optimal performance and scalability.

- Admin Portal: Access a dedicated admin portal to perform administrative tasks such as creating, deleting, and updating post categories. Manage author accounts, including blocking and unblocking authors as needed.

- Profile Customization: Personalize your author profile by uploading and updating your profile picture. Showcase your identity and create a unique presence within the blogging community.

## Installation
To get started with the web service locally, follow these steps:
1. Clone the repository.
2. Navigate to the project directory.
3. Install dependencies.
4. Configure environment variables: **MONGO_DB** = mongo uri, **MONGO_DB_PASS** = mongo uri user password, **JSON_WEB_TOKEN_SECRET** = json secret to create signature, **JSON_WEB_TOKEN_EXPIRESIN** = json token expire time, **SENDGRID_EMAIL_API_KEY** = sendgrid api key, **FRONTEND_DOMAIN_NAME** = front-end domain, **ADMIN_EMAIL** = admin email, **S3_BUCKET_NAME** = aws service s3 bucket name, **S3_BUCKET_ACCESS_KEY** = bucket access key, **S3_BUCKET_SECRET_ACCESS_KEY** = aws s3 secret key, **S3_REGION** = s3 region.
5. Start Development Server with npm.

## Technologies Used
- Node JS
- Express
- Mongoose
- JSON web token
- Multer
- Sharp
- AWS S3 Client
- Express Validator
- Bcrypt
- Many more

## Contributing
Contributions are welcome! you can freely contribute, provided that you have to comply with its basic structure.
