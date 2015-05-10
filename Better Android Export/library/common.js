#import 'library/sandbox.js'

var com = {};
com.animal = {
  exportWithFactors: function(factors) {
    if ([selection count] == 0) {
      [doc showMessage:"No layer is selected."];
    } else {
      var openDlg = [NSOpenPanel openPanel];

      // Enable the selection of files in the dialog.
      [openDlg setCanChooseFiles:false];
      [openDlg setCanChooseDirectories:true];
      [openDlg setAllowsMultipleSelection:false];
      [openDlg setPrompt:"Select"];

      if ( [openDlg runModalForDirectory:nil file:nil] == NSOKButton ) {

        for (var j=0; j < [selection count]; j++) {

          var layer = [selection objectAtIndex:j];
          var parent =  ([layer parentArtboard]) ? [layer parentArtboard] : [doc currentPage];
          var layerVisibility = [];

          [parent deselectAllLayers];

          var layerArray = [layer];
          [parent selectLayers:layerArray];

          var root = parent;

          var hideLayers = function(root, target) {
            // Hide all layers except for selected and store visibility
            for (var k=0; k < [[root layers] count]; k++) {
              var currentLayer = [[root layers] objectAtIndex:k];
              if ([currentLayer containsSelectedItem] && currentLayer != target) {
                hideLayers(currentLayer, target);
              } else if (!(currentLayer == target)) {
                var dict = [[NSMutableDictionary alloc] init];
                [dict addObject:currentLayer forKey:"layer"];
                [dict addObject:[currentLayer isVisible] forKey:"visible"];

                layerVisibility.push(dict);
                [currentLayer setIsVisible: false];
              }
            }
          }

          hideLayers(root, layer);

          var rect = [[layer absoluteRect] rect];
          var path = [[[openDlg URLs] objectAtIndex:0] fileSystemRepresentation];

          new AppSandbox().authorize(path, function() {
            var copyLayer = [layer duplicate];

            var exportSizes = [[copyLayer exportOptions] sizes];
            while([exportSizes count] > 0)
              [[exportSizes firstObject] remove];

            var fileNames = [];
            for (var f=0; f < factors.length; f++) {
              var factor = factors[f];

              var exportOption = [[copyLayer exportOptions] addExportSize];
              [exportOption setFormat:"png"];
              [exportOption setScale:factor["scale"]];
              [exportOption setName:factor["name"]];

              var fileName = path + "/" + factor["name"] + "/" + [layer name] + ".png";
              fileNames.push(fileName);
            }
            
            var slices = [MSSliceMaker slicesFromExportableLayer:copyLayer inRect:[copyLayer absoluteDirtyRect]];
            for (var i=0;i < [slices count]; i++)
              [doc saveArtboardOrSlice:slices[i] toFile:fileNames[i]];

            [copyLayer removeFromParent];
          });

          // Restore layers visibility
          for (var m=0; m < layerVisibility.length; m++) {
            var dict = layerVisibility[m];
            var layer = [dict objectForKey:"layer"];
            var visibility = [dict objectForKey:"visible"];

            if (visibility == 0) {
              [layer setIsVisible:false];
            } else {
              [layer setIsVisible:true];
            }
          }

          // Restore selection
          [parent selectLayers:selection];

        }
        [doc showMessage: [selection count] + " layers exported to " + path];
      }
    }
  }
}