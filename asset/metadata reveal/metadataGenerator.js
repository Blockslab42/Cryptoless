var fs = require('fs');

let i = 0;
while (i < 5000)
{
    const json = '{"name": "Cryptoless reveal '+i+'","description": "you will be able to see your NFT in a few days","image": "ipfs://QmYCpVmQsYWWVCZzDctvUHsFoKqCR3eVcWp1fiMBjGvH4L/reveal.png","edition": '+i+',"compiler": "ABRAXAS"}';
    fs.writeFile((i).toString(), json, function (err) {
        if (err) throw err;
        // console.log('File is created successfully.');
    });
    i ++;
}

// {
//     "name": "Cryptoless reveal",
//     "description": "Cryptoless reveal",
//     "image": "ipfs://QmYCpVmQsYWWVCZzDctvUHsFoKqCR3eVcWp1fiMBjGvH4L/reveal.png",
//     "animation_url":"ipfs://QmZVdCdJ8cBZd3x4bEknVwGnbxPoDEoH2jDusMEVVnr5tJ/index.html?id=0",
//     "animation_details": { "format": "HTML" },
//     "edition": 0,
//     "compiler": "ABRAXAS"
// }
