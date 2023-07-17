const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const app = express();
const port = 3000;
const connection = require('../Scora/public/js/db');
const fs = require('fs');
const { exec } = require('child_process');
const { Configuration, OpenAIApi } = require("openai");
require("dotenv").config();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'ide.html'));
});

app.post('/run_code', (req, res) => {
  const { language, code } = req.body;

  const random = Math.random().toString(36).substring(2, 9);
  const filePath = path.join(__dirname, `temp/${random}.${language}`);

  fs.writeFile(filePath, code, (err) => {
    if (err) {
      console.error('Error saving code: ' + err);
      res.status(500).send('Error saving code');
      return;
    }
  })
  let output = '';

  if (language === 'python') {
    const pythonExecutable = 'C:/Program Files/Python311/python.exe'
    exec(`"${pythonExecutable}" -c "${code}"`, (error, stdout, stderr) => {
      output = error ? `Error: ${error.message}` : stdout.trim();
      // console.log(output);
      res.status(200).type('text/plain').send(output)
    });
  }
  else if (language == 'node') {
    const wrappedCode = `(() => { ${code} })()`;
    exec(`node -e "${wrappedCode}"`, (error, stdout, stderr) => {
      const output = error ? `Error: ${error.message}` : stdout.trim();
      // console.log(output);
      res.status(200).type('text/plain').send(output);
    })
  }
  else if (language == 'java') {
    const className = 'Main';
    const javaExecutable = 'C:/Program Files/Java/jdk-17/bin/java.exe'
    const javacExeccutable = 'C:/Program Files/Java/jdk-17/bin/javac.exe'
    const arguments = 'arg1 arg2 arg3'
    exec(`javac ${filePath} && java -cp ${filePath.split('/').slice(0, -1).join('/')} ${className} ${arguments}`, (error, stdout, stderr) => {
      const output = error ? `Error: ${error.message}` : stdout.trim();
      console.log(output);
      res.status(200).type('text/plain').send(output);
    })
  }
  else if (language == 'c') {
    exec(`gcc -xc -o temp.out - && ./temp.out`, { input: code, encoding: 'utf8' }, (error, stdout, stderr) => {
      const output = error ? `Error: ${error.message}` : stdout.trim();
      // console.log(output);
      res.status(200).type('text/plain').send(output);
    })
  }
});

app.post('/save_code', (req, res) => {
  const { question, language, code } = req.body;

  const createQuery = `
  CREATE TABLE IF NOT EXISTS user_codes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question TEXT,
    language VARCHAR(50) NOT NULL,
    code TEXT NOT NULL,
    FULLTEXT(question)
  );
  `;

  const insertQuery = 'INSERT INTO user_codes (question,language, user_code) VALUES (?, ?, ?)';

  connection.query(createQuery, (err, createResult) => {
    if (err) {
      console.error('Error creating table: ' + err.stack);
      res.status(500).send('Error saving code');
      return;
    }

    connection.query(insertQuery, [question, language, code], (err, insertResult) => {
      if (err) {
        console.error('Error saving code: ' + err.stack);
        res.status(500).send('Error saving code');
        return;
      }

      console.log('Code saved successfully');
      res.status(200).send('Code saved successfully');
    });
  });
});

app.get('/view_code', (req, res) => {
  const selectQuery = 'SELECT * FROM code_snippets';

  connection.query(selectQuery, (err, results) => {
    if (err) {
      console.error('Error retrieving code: ' + err.stack);
      res.status(500).send('Error retrieving code');
      return;
    }
    const codeSnippets = results;
    res.status(200).json(codeSnippets);
  });
});

const important_factors = `user code should be O(n)`;
const output = `"Effectiveness":/100, "DataStructures Score":/100, "Completeness":/100, "Approach":/100, "Readability":/100, "Modularity":/100, "Performance":/100, "Error Handling":/100, "Code Reusability":/100, "Documentation":/100, "Overall":/100, "Comments": "any info should give given here"}
`
var target_code=""
var imp_factors=""
app.post('/integrate_api', async (req, res) => {
  const { question, language, code } = req.body
  const selectQuery = `SELECT target_code, imp_factors FROM target_codes WHERE MATCH(question) AGAINST('${question}' IN NATURAL LANGUAGE MODE)  AND language = '${language}'`
  const values = [question, language];
  connection.query(selectQuery, values, async (err, results) => {
    if (err) {
      console.error('Error retrieving code: ' + err.stack);
      res.status(500).send('Error retrieving code');
      return;
    }
      target_code = results[0].target_code;
      imp_factors = results[0].imp_factors;
  })
    const complete_prompt_train= 'hello'
    //  messages = [
    //   {role: "system", content: "You are an AI assistant that evaluates the Java or Python or C or C++ code for a given coding_question with the user_code against the answer_code considering the important_factors of code and produce the results in the form of a dictionary eg: {Effectiveness:/100, DataStructures Score:/100, Completeness:/100, Approach:/100, Readability:/100, Modularity:/100, Performance:/100, Error Handling:/100, Code Reusability:/100, Documentation:/100, Overall:/100, Comments:any info should give given here"},
    //   {role: "user", content: `${complete_prompt_train}`},
    //   {role: "assistant", content:{"Effectiveness":100, "DataStructures Score":100, "Completeness":100, "Approach":100, "Readability":100, "Modularity":100, "Performance":100, "Error Handling":100, "Code Reusability":100, "Documentation":100, "Overall":100, "Comments":"" }},
    // ]
    const messages = [
      { role: "system", content: "You are a helpful assistant." },
      { role: "user", content:`evaluate the ${code} against the ${target_code} considering the ${imp_factors} and the output you give must be in the form ${output}`},
    ];
    try {
      const completion = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        temperature: 0.8,
        max_tokens: 2000,
        messages: messages,
      });

      const output = completion.data.choices[0].message.content;
      res.send(output);
    } catch (error) {
      console.error("Error:", error.message);
      res.status(500).send("Error occurred");
    }
  })
app.listen(port, () => {
  console.log('Server is running on port ' + port);
});