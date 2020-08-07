 /* 
/// DYNAMIC PIXEL SCALING PLUGIN
*/
ig.module(
	'plugins.dynscale'
)
.requires(
	'impact.impact'
)
.defines(function(){

    ig.Image.inject({

        dataUnscaled: null,
        widthUnscaled: 0,
        heightUnscaled: 0,

        onload: function( event )  {
            this.widthUnscaled  = this.data.width;
            this.heightUnscaled = this.data.height;
            this.dataUnscaled = this.data;

            this.parent( event );
        },


        resize: function( scale ) {
            this.resizeNearestNeighbor(scale);
        },


        resizeNearestNeighbor: function (scale) {
            // Nearest-Neighbor scaling
        
            // The original image is drawn into an offscreen canvas of the same size
            // and copied into another offscreen canvas with the new size. 
            // The scaled offscreen canvas becomes the image (data) of this object.

            var w = this.widthUnscaled;
            var h = this.heightUnscaled;

            var widthScaled = w * scale;
            var heightScaled = h * scale;

            var orig = ig.$new('canvas');
            orig.width = w;
            orig.height = h;
            var origCtx = orig.getContext('2d');
            origCtx.drawImage(this.dataUnscaled, 0, 0, w, h, 0, 0, w, h);
            var origPixels = origCtx.getImageData(0, 0, w, h);

            var scaled = ig.$new('canvas');
            scaled.width = widthScaled;
            scaled.height = heightScaled;
            var scaledCtx = scaled.getContext('2d');
            var scaledPixels = scaledCtx.getImageData(0, 0, widthScaled, heightScaled);
            for (var y = 0; y < heightScaled; y++) {
                for (var x = 0; x < widthScaled; x++) {
                var index = ((y / scale).floor() * w + (x / scale).floor()) * 4;
                var indexScaled = (y * widthScaled + x) * 4;
                scaledPixels.data[indexScaled] = origPixels.data[index];
                scaledPixels.data[indexScaled + 1] = origPixels.data[index + 1];
                scaledPixels.data[indexScaled + 2] = origPixels.data[index + 2];
                scaledPixels.data[indexScaled + 3] = origPixels.data[index + 3];
                }
            }
            scaledCtx.putImageData(scaledPixels, 0, 0);

            this.data = scaled;
        }

    });

}); // end define
