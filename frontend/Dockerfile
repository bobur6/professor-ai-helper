# Stage 1: Build the React application
FROM node:20-alpine as build

WORKDIR /app

COPY package*.json ./

RUN npm install
RUN npm install react-toastify

COPY . .

RUN npm run build

# Stage 2: Serve the application using a lightweight server
FROM node:20-alpine

WORKDIR /app

# Install a simple static file server
RUN npm install -g serve

COPY --from=build /app/dist /app/dist

# Expose the port the app runs on
EXPOSE 5173

# Command to serve the app
CMD ["serve", "-s", "dist", "-l", "5173"]
