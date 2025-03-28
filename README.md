# Database Schema Assistant(KeyMap)

## Overview

The **Database Schema Assistant** is a web application that helps users design and manage database schemas using natural language. It integrates with the **Hugging Face API** to analyze user input, generate database schemas, and provide dynamic responses. The application is built using **Next.js** for the frontend and backend, with a focus on simplicity, scalability, and user-friendliness.

---

## Design Decisions

### 1. **AI Integration**
   - **Why Hugging Face?**
     - Hugging Face provides pre-trained models like **Mistral-7B** that are highly effective for natural language processing tasks.
     - It allows us to offload the heavy lifting of schema analysis and generation to a robust AI model.
   - **How It Works:**
     - The user's input is sent to the Hugging Face API, which analyzes the request and generates a structured JSON response containing entities, attributes, and relationships.
     - The response is then processed to create a database schema.

### 2. **Schema Generation**
   - **Dynamic Schema Appending:**
     - The assistant appends new tables to the existing schema instead of overwriting it.
     - This ensures that the schema evolves as the user provides more details.
   - **Schema Visualization:**
     - The generated schema is displayed at the top of the page for easy reference.
     - Tables and relationships are dynamically rendered using a visualization component.

### 3. **Storage Mechanisms**
   - **Project Storage:**
     - Each project is stored in a database with a unique ID, name, and schema.
     - The schema is stored as a JSON object, making it easy to retrieve and update.
   - **Session Management:**
     - The application uses **Next.js API routes** to handle project creation, updates, and deletions.
     - The project state is managed on the client side, ensuring a smooth user experience.

---

## Technology Choices

### Frontend
- **Next.js**: A React framework for server-side rendering and API routes.
- **Tailwind CSS**: A utility-first CSS framework for styling.
- **Lucide Icons**: A lightweight icon library for UI elements.

### Backend
- **Next.js API Routes**: For handling API requests and interacting with the database.
- **Hugging Face API**: For natural language processing and schema generation.

### Database
- **MongoDB**: A NoSQL database for storing project data.
- **Mongoose**: An ODM (Object Data Modeling) library for MongoDB.

---

## How It Works

1. **User Input**:
   - The user describes their database needs in natural language (e.g., "Create a database for employees and companies").
2. **AI Analysis**:
   - The input is sent to the Hugging Face API, which identifies entities, attributes, and relationships.
3. **Schema Generation**:
   - The assistant generates a database schema based on the AI's response.
4. **Schema Visualization**:
   - The schema is displayed at the top of the page, and the user can interact with it.
5. **Dynamic Updates**:
   - The user can refine the schema by providing additional input (e.g., "Add a table for roles").
6. **Project Management**:
   - The user can create, update, and delete projects, with all changes saved in the database.

---

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud-based)
- Hugging Face API token

### Steps

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/Mustez-hero/KeyMap-DB-AI.git
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Set Up Environment Variables**:
   Create a `.env.local` file in the root directory and add the following variables:
   ```env
   MONGODB_URI=your_mongodb_connection_string
   HUGGING_FACE_API_TOKEN=your_hugging_face_api_token
   ```

4. **Run the Development Server**:
   ```bash
   npm run dev
   ```

5. **Access the Application**:
   Open your browser and navigate to `http://localhost:3000`.

---

## Demo

A live demo of the application is available at [].

---

## Features

- **Natural Language Input**: Describe your database needs in plain English.
- **Dynamic Schema Generation**: The assistant generates and updates the schema based on your input.
- **Schema Visualization**: View the schema as a diagram for better understanding.
- **Project Management**: Create, update, and delete projects with ease.

---

## Future Improvements

- **Support for Multiple Database Types**: Add support for SQL, NoSQL, and other database types.
- **Collaboration Features**: Allow multiple users to collaborate on the same project.
- **Export Options**: Export the schema as SQL scripts, JSON, or other formats.
- **Enhanced AI Capabilities**: Integrate more advanced AI models for better schema analysis.

---

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a new branch for your feature or bugfix.
3. Submit a pull request with a detailed description of your changes.

---

## Contact

For questions or feedback, please reach out to [abdulhamidmustabshir@.com] (mailto:abdulhamidmustabshir@.com).

---
