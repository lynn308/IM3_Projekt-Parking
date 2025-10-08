console.log ("hello world");

fetch('https://im3-projekt.lynnhartmann.ch/unload.php')
    .then(response => response.json())
    .then(data => {
        console.log(data);
    })
    .catch(error => {
        console.error('Error:', error);
    });

    fetch('https://im3-projekt.lynnhartmann.ch/unload_single.php')
    .then(response => response.json())
    .then(data => {
        console.log(data);
    })
    .catch(error => {
        console.error('Error:', error);
    });