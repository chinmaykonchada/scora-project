const express=require('express');
const bodyParser=require('body-parser');
const path=require('path');
const { v4: uuidv4 } = require('uuid');
const app=express();
const port = 3000;
const connection=require('../Scora/public/js/db');
const fs= require('fs');
const { exec } = require('child_process');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'ide.html'));
});

// app.post('/save_code', (req, res) => {
// const { language, code } = req.body;
// console.log(req.body.output);
// const createQuery = `CREATE TABLE IF NOT EXISTS code_snippets (
//       id INT AUTO_INCREMENT PRIMARY KEY,
//       language VARCHAR(50) NOT NULL,
//       code TEXT NOT NULL
//     );
//   `;

// const query = 'INSERT INTO code_snippets (language, code) VALUES (?, ?)';
// connection.query(query, [language, code], (err, results) => {
// if (err) {
//     console.error('Error saving code: ' + err.stack);
//     return;
// }
//     console.log('Code saved successfully');
//     });
//   });

// app.post('/save_code', (req, res) => {
//     const { language, code } = req.body;
//     console.log(req.body);
//     res.status(200).send('Code saved successfully');
// });

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
        exec(`"${pythonExecutable}" -c "${code}"` ,(error, stdout, stderr) => {
         output = error ? `Error: ${error.message}` : stdout.trim();
        // console.log(output);
        res.status(200).type('text/plain').send(output)
      });
    }
   else if(language=='node'){
    const wrappedCode = `(() => { ${code} })()`;
    exec(`node -e "${wrappedCode}"`, (error, stdout, stderr) => {
      const output = error ? `Error: ${error.message}` : stdout.trim();
      // console.log(output);
      res.status(200).type('text/plain').send(output);
    })
  }
  else if(language=='java')
  {
    const className ='Main';
    const javaExecutable='C:/Program Files/Java/jdk-17/bin/java.exe'
    const javacExeccutable='C:/Program Files/Java/jdk-17/bin/javac.exe'
    const arguments = 'arg1 arg2 arg3'
    exec(`javac ${filePath} && java -cp ${filePath.split('/').slice(0, -1).join('/')} ${className} ${arguments}`, (error, stdout, stderr) => {
      const output = error ? `Error: ${error.message}` : stdout.trim();
      console.log(output);
      res.status(200).type('text/plain').send(output);
  })
  }
  else if(language=='c'){
    exec(`gcc -xc -o temp.out - && ./temp.out`, { input: code , encoding: 'utf8'}, (error, stdout, stderr) => {
      const output = error ? `Error: ${error.message}` : stdout.trim();
      // console.log(output);
      res.status(200).type('text/plain').send(output);
  })
 }
});


app.post('/save_code', (req, res) => {
  const { language, code } = req.body;

  const createQuery = `
    CREATE TABLE IF NOT EXISTS code_snippets (
      id INT AUTO_INCREMENT PRIMARY KEY,
      language VARCHAR(50) NOT NULL,
      code TEXT NOT NULL
    )
  `;

  const insertQuery = 'INSERT INTO code_snippets (language, code) VALUES (?, ?)';

  connection.query(createQuery, (err, createResult) => {
    if (err) {
      console.error('Error creating table: ' + err.stack);
      res.status(500).send('Error saving code');
      return;
    }

    connection.query(insertQuery, [language, code], (err, insertResult) => {
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

app.listen(port, () => {
    console.log('Server is running on port ' + port);
  });