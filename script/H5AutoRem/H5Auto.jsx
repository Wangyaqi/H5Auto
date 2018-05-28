function H5Auto() {
	app.preferences.rulerUnits = Units.PIXELS;
	var doc = app.activeDocument;
	//doc.rasterizeAllLayers ();
	var docpath = doc.path;
	var docname = doc.name.split(".")[0];
	var scriptpath = new File($.fileName).parent;
	var templatepath = scriptpath + "/template/";
	var outputpath = new Folder(docpath + "/" + docname + "/");
	if(outputpath.exists) {
		if(!confirm("输出目录已存在是否覆盖？", "提示")) {
			return false;
		}
	}
	var template = new Folder(templatepath);
	copyFiles(template, outputpath, '');

	//根元素字体大小
	var rootsize = 100;

	//script.js模版处理
	var scriptfile = new File(outputpath + "/js/script.js");
	var scriptread = "";
	scriptfile.open("r");
	scriptfile.encoding = 'utf-8';
	scriptread = scriptfile.read();
	scriptfile.close();
	var script_d_width = doc.width.as('px');
	var script_d_height = doc.height.as('px');
	scriptread = scriptread.replace(/{{rootsize}}/g, rootsize.toString());
	scriptread = scriptread.replace(/{{script_d_width}}/g, script_d_width.toString());
	scriptread = scriptread.replace(/{{script_d_height}}/g, script_d_height.toString());
	scriptfile.open("w");
	scriptfile.encoding = 'utf-8';
	scriptfile.write(scriptread);
	scriptfile.close();

	//index.html模版处理
	var index_page_template = '<div class="page {{index_page_no}}" id="{{index_page_no}}">\n<div class="page_box">\n{{index_page_main}}</div>\n{{index_page_down}}</div>';
	var index_page_down = '<img class="page_down" src="img/down.png" />\n';
	var index_img_template = '<img class="{{index_img_class}}" src="img/{{index_img_name}}.png" />\n';
	var img_group_template = '<div>{{img}}</div>';
	var page_main_content = "";
	var page_length = doc.layerSets.length;
	var page_index = 0;

	//style.css模版处理
	var style_ele_block = '.{{style_ele_name}} {position: absolute;width: {{style_ele_width}};height: auto;left: {{style_ele_left}};top: {{style_ele_top}};}';
	var style_content_main = "";
	var style_page_bg = "";
	var page_with_bg = '.{{index_page_no}} {background-image: url(../img/{{page_bg}}.jpg);}';

	//图层遍历
	getLayers(doc.layers, 0);

	//读写html模版
	var htmlfile = new File(outputpath + "/index.html");
	var htmlread = "";
	htmlfile.open("r");
	htmlfile.encoding = 'utf-8';
	htmlread = htmlfile.read();
	htmlfile.close();
	htmlread = htmlread.replace(/{{page_title}}/g, docname);
	htmlread = htmlread.replace(/{{page_main_content}}/g, page_main_content);
	htmlfile.open("w");
	htmlfile.encoding = 'utf-8';
	htmlfile.write(htmlread);
	htmlfile.close();

	//读写css模版
	var cssfile = new File(outputpath + "/css/style.css");
	var cssread = "";
	cssfile.open("r");
	cssfile.encoding = 'utf-8';
	cssread = cssfile.read();
	cssfile.close();
	cssread = cssread.replace(/{{rootfontsize}}/g, (rootsize / script_d_width * 100).toFixed(6).toString());
	cssread = cssread.replace(/{{style_page_bg}}/g, style_page_bg);
	cssread = cssread.replace(/{{style_content_main}}/g, style_content_main);
	cssfile.open("w");
	cssfile.encoding = 'utf-8';
	cssfile.write(cssread);
	cssfile.close();

	function getLayers(layers) {
		for(var i = layers.length - 1; i >= 0; i--) {
			if(layers[i].typename == "LayerSet") {
				page_index += 1;
				buildpage(layers[i].layers, page_index, page_length);
			} else if(layers[i].name == "bg") {
				style_page_bg = 'background-image: url(../img/bg.jpg);';
				saveLayer(layers[i], "bg", "bg");
			}
		}
	}

	function buildpage(artLayers, i, len) {
		var page_img_list = "";
		for(var k = artLayers.length - 1; k >= 0; k--) {
			if(artLayers[k].visible) {
				if(artLayers[k].name == "bg") {
					var page_with_bg_temp = page_with_bg.replace(/{{index_page_no}}/g, "page_" + i);
					page_with_bg_temp = page_with_bg_temp.replace(/{{page_bg}}/g, "bg_" + i);
					style_content_main += page_with_bg_temp;
					saveLayer(artLayers[k], "bg_" + i, "bg");
				} else if(artLayers[k].typename == "ArtLayer") {
					var img_temp = index_img_template.replace(/{{index_img_class}}/g, "p_" + i + "_" + k);
					img_temp = img_temp.replace(/{{index_img_name}}/g, "p_" + i + "_" + k);
					page_img_list += img_temp;
					var style_ele_block_temp = style_ele_block.replace(/{{style_ele_name}}/g, "p_" + i + "_" + k)
					style_ele_left = artLayers[k].bounds[0].as('px');
					style_ele_top = artLayers[k].bounds[1].as('px');
					style_ele_width = artLayers[k].bounds[2].as('px') - style_ele_left;
					style_ele_block_temp = style_ele_block_temp.replace(/{{style_ele_width}}/g, style_ele_width / rootsize + "rem")
					style_ele_block_temp = style_ele_block_temp.replace(/{{style_ele_left}}/g, style_ele_left / rootsize + "rem")
					style_ele_block_temp = style_ele_block_temp.replace(/{{style_ele_top}}/g, style_ele_top / rootsize + "rem")
					style_content_main += style_ele_block_temp;
					saveLayer(artLayers[k], "p_" + i + "_" + k, "")
				} else if(artLayers[k].typename == "LayerSet") {
					page_img_list += buildGroup(artLayers[k].layers, "p_" + i + "_" + k);
				}
			}
		}
		var down_temp = "";
		if(page_index < page_length) {
			down_temp = index_page_down;
		}
		var index_page_no = "page_" + i;
		var index_page_temp = index_page_template.replace(/{{index_page_no}}/g, index_page_no);
		index_page_temp = index_page_temp.replace(/{{index_page_down}}/g, down_temp);
		index_page_temp = index_page_temp.replace(/{{index_page_main}}/g, page_img_list);
		page_main_content += index_page_temp;
	}

	function buildGroup(layers, parentClass) {
		var group_html = "<div>\n";
		for(var i = layers.length - 1; i >= 0; i--) {
			if(layers[i].typename == "LayerSet") {
				group_html += buildGroup(layers[i].layers, parentClass + "_" + i);
			} else {
				var img_temp = index_img_template.replace(/{{index_img_class}}/g, parentClass + "_" + i);
				img_temp = img_temp.replace(/{{index_img_name}}/g, parentClass + "_" + i);
				group_html += img_temp;
				var style_ele_block_temp = style_ele_block.replace(/{{style_ele_name}}/g, parentClass + "_" + i)
				style_ele_left = layers[i].bounds[0].as('px');
				style_ele_top = layers[i].bounds[1].as('px');
				style_ele_width = layers[i].bounds[2].as('px') - style_ele_left;
				style_ele_block_temp = style_ele_block_temp.replace(/{{style_ele_width}}/g, style_ele_width / rootsize + "rem")
				style_ele_block_temp = style_ele_block_temp.replace(/{{style_ele_left}}/g, style_ele_left / rootsize + "rem")
				style_ele_block_temp = style_ele_block_temp.replace(/{{style_ele_top}}/g, style_ele_top / rootsize + "rem")
				style_content_main += style_ele_block_temp;
				saveLayer(layers[i], parentClass + "_" + i, "")
			}
		}
		group_html += "</div>\n";
		return group_html;
	}

	function saveLayer(layer, name, savetype) {
		var bounds = layer.bounds;
		var width;
		var height;
		if(savetype == "bg") {
			layer.copy();
			var width = script_d_width;
			var height = script_d_height;
			app.documents.add(width, height, 72, "myDocument", NewDocumentMode.RGB, DocumentFill.TRANSPARENT);
			app.activeDocument.paste();
			var file = new File(outputpath + "/img/" + name + ".jpg");
			var option = new ExportOptionsSaveForWeb();
			option.format = SaveDocumentType.JPEG;
			app.activeDocument.exportDocument(file, ExportType.SAVEFORWEB, option);
		} else {
			doc.activeLayer = layer;
			var width = bounds[2].as('px') - bounds[0].as('px');
			var height = bounds[3].as('px') - bounds[1].as('px');
			var region = [
				[bounds[0].as('px'), bounds[1].as('px')],
				[bounds[2].as('px'), bounds[1].as('px')],
				[bounds[2].as('px'), bounds[3].as('px')],
				[bounds[0].as('px'), bounds[3].as('px')]
			];
			var type = SelectionType.REPLACE;
			var feather = 0;
			var antiAlias = true;
			doc.selection.select(region, type, feather, antiAlias);
			app.activeDocument.selection.copy();
			app.documents.add(width, height, 72, "myDocument", NewDocumentMode.RGB, DocumentFill.TRANSPARENT);
			app.activeDocument.paste();
			var file = new File(outputpath + "/img/" + name + ".png");
			var option = new ExportOptionsSaveForWeb();
			option.format = SaveDocumentType.PNG;
			option.PNG8 = false;
			app.activeDocument.exportDocument(file, ExportType.SAVEFORWEB, option);
		}

		app.activeDocument.close(SaveOptions.DONOTSAVECHANGES);
		app.activeDocument = doc;
	}

	function copyFiles(src, target) {
		var srcdir = new Folder(src);
		var targetdir = new Folder(target);
		if(targetdir.exists) {
			targetdir.remove();
		}
		targetdir.create();
		var files = srcdir.getFiles();
		for(var i = 0; i < files.length; i++) {
			var ifile = files[i];
			if(ifile instanceof Folder) {
				copyFiles(src + '/' + ifile.name, target + '/' + ifile.name);
				continue;
			}
			var ofile = new File(targetdir + '/' + ifile.name);
			if(ofile.exists) {
				ofile.remove();
			}
			ifile.copy(ofile);
		}
	};
}
H5Auto();