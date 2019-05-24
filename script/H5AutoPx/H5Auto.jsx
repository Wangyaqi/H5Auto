function H5Auto() {
	app.preferences.rulerUnits = Units.PIXELS;
	var doc = app.activeDocument;
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

	//script.js模版处理
	var scriptfile = new File(outputpath + "/js/script.js");
	var scriptread = "";
	scriptfile.open("r");
	scriptfile.encoding = 'utf-8';
	scriptread = scriptfile.read();
	scriptfile.close();
	var script_d_width = doc.width.as('px');
	var script_d_height = doc.height.as('px');
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
	var index_text_template = '<div class="{{index_text_class}}"><p>{{index_text_contents}}</p></div>';
	var img_group_template = '<div>{{img}}</div>';
	var page_main_content = "";
	var page_length = doc.layerSets.length;
	var page_index = 0;

	//style.css模版处理
	var style_ele_block = '.{{style_ele_name}} {position: absolute;width: {{style_ele_width}};height: auto;left: {{style_ele_left}};top: {{style_ele_top}};}';
	var style_text_block = '.{{style_text_name}} {position: absolute;width: {{style_text_width}};height: {{style_text_height}};left: {{style_text_left}};top: {{style_text_top}};line-height: {{style_text_lineheight}};font-size: {{style_text_fontsize}};text-indent: {{style_text_textindent}};color: {{style_text_color}};}';
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
	htmlread = htmlread.replace(/{{page_width}}/g, script_d_width);
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
	cssread = cssread.replace(/{{style_page_bg}}/g, style_page_bg);
	cssread = cssread.replace(/{{style_page_width}}/g, script_d_width);
	cssread = cssread.replace(/{{style_page_halfwidth}}/g, script_d_width / 2);
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
		var group_html = "";
		var layers = [];
		for(var k = 0; k <= artLayers.length - 1; k++) {
			if(!artLayers[k].visible) {
				continue;
			}
			if(artLayers[k].name == "bg") {
				var page_with_bg_temp = page_with_bg.replace(/{{index_page_no}}/g, "page_" + i);
				page_with_bg_temp = page_with_bg_temp.replace(/{{page_bg}}/g, "bg_" + i);
				style_content_main += page_with_bg_temp;
				saveLayer(artLayers[k], "bg_" + i, "bg");
				continue;
			}
			layers.push(artLayers[k]);

		}
		group_html += buildGroup(layers, "p_" + i);
		var down_temp = "";
		if(page_index < page_length) {
			down_temp = index_page_down;
		}
		var index_page_no = "page_" + i;
		var index_page_temp = index_page_template.replace(/{{index_page_no}}/g, index_page_no);
		index_page_temp = index_page_temp.replace(/{{index_page_down}}/g, down_temp);
		index_page_temp = index_page_temp.replace(/{{index_page_main}}/g, group_html);
		page_main_content += index_page_temp;
	}

	function buildGroup(layers, parentClass) {
		var group_html = "<div class='" + parentClass + "'>\n";
		for(var i = layers.length - 1; i >= 0; i--) {
			if(layers[i].typename == "LayerSet") {
				group_html += buildGroup(layers[i].layers, parentClass + "_" + i);
			} else if(layers[i].kind === LayerKind.TEXT) {
				var text_item = layers[i].textItem;
				var text_temp = index_text_template.replace(/{{index_text_class}}/g, parentClass + "_" + i);
				text_temp = text_temp.replace(/{{index_text_contents}}/g, text_item.contents.replace(/\r/g, "&nbsp;</p><p>"));
				group_html += text_temp;
				var style_text_block_temp = style_text_block.replace(/{{style_text_name}}/g, parentClass + "_" + i);
				style_text_left = layers[i].bounds[0].as('px');
				style_text_top = layers[i].bounds[1].as('px');
				style_text_width = layers[i].bounds[2].as('px') - style_text_left;
				style_text_height = layers[i].bounds[3].as('px') - style_text_top;
				style_text_block_temp = style_text_block_temp.replace(/{{style_text_width}}/g, style_text_width + "px");
				style_text_block_temp = style_text_block_temp.replace(/{{style_text_height}}/g, style_text_height + "px");
				style_text_block_temp = style_text_block_temp.replace(/{{style_text_left}}/g, style_text_left + "px");
				style_text_block_temp = style_text_block_temp.replace(/{{style_text_top}}/g, style_text_top + "px");
				style_text_block_temp = style_text_block_temp.replace(/{{style_text_fontsize}}/g, text_item.size.as('px') + "px");
				style_text_block_temp = style_text_block_temp.replace(/{{style_text_lineheight}}/g, text_item.leading.as('px') + "px");
				style_text_block_temp = style_text_block_temp.replace(/{{style_text_textindent}}/g, text_item.firstLineIndent.as('px') + "px");
				style_text_block_temp = style_text_block_temp.replace(/{{style_text_color}}/g, text_item.color.rgb);
				style_content_main += style_text_block_temp;
			} else {
				var img_temp = index_img_template.replace(/{{index_img_class}}/g, parentClass + "_" + i);
				img_temp = img_temp.replace(/{{index_img_name}}/g, parentClass + "_" + i);
				group_html += img_temp;
				var style_ele_block_temp = style_ele_block.replace(/{{style_ele_name}}/g, parentClass + "_" + i);
				style_ele_left = layers[i].bounds[0].as('px');
				style_ele_top = layers[i].bounds[1].as('px');
				style_ele_width = layers[i].bounds[2].as('px') - style_ele_left;
				style_ele_block_temp = style_ele_block_temp.replace(/{{style_ele_width}}/g, style_ele_width + "px");
				style_ele_block_temp = style_ele_block_temp.replace(/{{style_ele_left}}/g, style_ele_left + "px");
				style_ele_block_temp = style_ele_block_temp.replace(/{{style_ele_top}}/g, style_ele_top + "px");
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
		var temp_doc;
		if(savetype == "bg") {
			layer.copy();
			var width = script_d_width;
			var height = script_d_height;
			temp_doc = app.documents.add(width, height, 72, "myDocument", NewDocumentMode.RGB, DocumentFill.TRANSPARENT);
			app.activeDocument.paste();
			var file = new File(outputpath + "/img/" + name + ".jpg");
			var option = new ExportOptionsSaveForWeb();
			option.format = SaveDocumentType.JPEG;
			app.activeDocument.exportDocument(file, ExportType.SAVEFORWEB, option);
		} else {
			doc.activeLayer = layer;
			//layer.rasterize(RasterizeType.ENTIRELAYER);
			var empty_layer = layer.parent.artLayers.add();
			empty_layer.move(layer,ElementPlacement.PLACEAFTER);
			layer.merge();
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
			temp_doc = app.documents.add(width, height, 72, "myDocument", NewDocumentMode.RGB, DocumentFill.TRANSPARENT);
			temp_doc.paste();
			var file = new File(outputpath + "/img/" + name + ".png");
			var option = new ExportOptionsSaveForWeb();
			option.format = SaveDocumentType.PNG;
			option.PNG8 = false;
			temp_doc.exportDocument(file, ExportType.SAVEFORWEB, option);
		}

		temp_doc.close(SaveOptions.DONOTSAVECHANGES);
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