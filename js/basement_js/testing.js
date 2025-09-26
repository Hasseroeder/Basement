mergeImages(
    [ 
        {src:'../media/owo_images/HP.png'},
        {src:'../media/owo_images/PR.png'}
    ],
    { width: 128, height: 128 }
)
.then(b64 => console.log(b64))
.catch(err => console.error('mergeImages failed:', err));