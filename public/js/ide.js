let editor;
window.onload = function() {
    editor = ace.edit("editor");
    editor.setTheme("ace/theme/monokai");
    editor.session.setMode("ace/mode/c_cpp");
}

function changeLanguage() {

    let language = $("#languages").val();

    if(language == 'c' || language == 'cpp')editor.session.setMode("ace/mode/c_cpp");
    else if(language == 'php')editor.session.setMode("ace/mode/php");
    else if(language == 'python')editor.session.setMode("ace/mode/python");
    else if(language == 'node')editor.session.setMode("ace/mode/javascript");
    console.log(language);
}
var output = document.getElementById("output");
// function executeCode() {
//     const code=editor.getSession().getValue()

//     $.ajax({

//         url: "/save_code",
//         method: "POST",
//         data: {
//             language: $("#languages").val(),
//             code: editor.getSession().getValue()
//         },

//         success: function(response) {
//             $(".output").text(response)
//         }
//     })
//     // var outputText = "";

//     // try {
//     //   outputText = eval(code);
//     // } catch (error) {
//     //   outputText = "Error: " + error.message;
//     // }

//     // output.textContent = outputText;
   
// }

function saveCode() {
    const data = {
      question: document.querySelector('#question_text').innerHTML,
      language: $("#languages").val(),
      code: editor.getSession().getValue()
    };
    console.log(data);
    fetch("/save_code", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)}).then(response => {
        if (response.ok) {
          return response.text();
        }
        throw new Error("Error saving the code");
      })
      .then(responseText => {
        console.log(responseText);
      })
      .catch(error => {
        console.error(error);
      });
  }
  function retrieveCode() {
    fetch('/view_code')
      .then(response => {
        if (!response.ok) {
          throw new Error('Error retrieving code: ' + response.status);
        }
        return response.json();
      })
      .then(codeSnippets => {
        console.log(codeSnippets);
      })
      .catch(error => {
        console.error('Error retrieving code: ' + error);
      });
  }
  function executeCode(){
    const data = {
        language: $("#languages").val(),
        code: editor.getSession().getValue()
      };
      console.log(data);
      fetch("/run_code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)}).then(response => {
          if (response.ok) {
            return response.text();
          }
          throw new Error("Error saving the code");
        })
        .then(responseText => {
          console.log(responseText);
          const op=document.getElementById('output');
          op.innerHTML=`<h3>${responseText}</h3>`
        })
        .catch(error => {
          console.error(error);
        });
  }
  function integrateapi(){
    const data = {
      question: document.querySelector('#question_text').innerHTML,
      language: $("#languages").val(),
      code: editor.getSession().getValue()
    };
    console.log(data);

  // fetch('/integrate_api')
  // .then(response => {
  //   if (!response.ok) {
  //     throw new Error('Error retrieving response from server');
  //   }
  //   return response.text();
  // })
  // .then(output => {
  //   // Handle the output received from the server
  //   console.log(output);
  //   // Display the output in your frontend UI
  //   document.getElementById('output').textContent = output;
  // })
  // .catch(error => {
  //   console.error('Error:', error);
  // });

  fetch("/integrate_api", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)}).then(response => {
      if (response.ok) {
        return response.text();
      }
      throw new Error("Error saving the code");
    })
    .then(responseText => {
      console.log(responseText);
      document.getElementById('output').textContent =responseText;
    })
    .catch(error => {
      console.error(error);
    });
  }

  