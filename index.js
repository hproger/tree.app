/**
 * @getInstance() - полная настройка соединительных линий, 
 * 				конечных точек, мест крепления точек, оверлеев
 * 				
 * @addEndpoint - добавление соеденительной точки к элементу
 *
 * @generateCode() - генерация Json
 *
 * @createPoint() - создание новой соеденительной точки
 *
 * @generateNode(child, targetEl, generate) - создание элемента ( child - bool - дочерний или нет, targetEl - string - id родительского элемента, generate - bool - генерируется код или нет )
 *
 * @generateGraph() - создание первой точки на первом элементе
 *
 * @dargable - даёт возможность двигать элементы
 *
 * @moveTarget(sourceId, targetId) - переносит один элемент в другой 
 * 				( sourceId - id родительского элемента, targetId - id дочернего(перемещаемого) )
 *
 * jsPlumb.bind() - биндим события jsPlumb'а
 * 
 */



window.onload = function(){
	let sourceId, targetId;
	var instancePlumb = jsPlumb.getInstance({
		PaintStyle:{ 
	    strokeWidth:2, 
	    stroke:"yellow"
	  },
	  Connector:[ "Straight" ],
	  Endpoint:[ "Rectangle", { width: 20, height: 20 , cssClass:'myAnchor'} ],
	  EndpointStyle : { fill: "red"  },
	  Anchor : [ 0.5, 1, 1, 1 ],
	  Overlays: [
	        [ "Arrow", { foldback:0.5 } ] 
	    ] 
	} );
	instancePlumb.bind("connection", function (info, originalEvent) {
    sourceId = info.connection.sourceId,
    targetId = info.connection.targetId;
    // console.log('sourceId - '+sourceId);
    // console.log('targetId - '+targetId);
    // console.log(originalEvent);
    // console.log('=========================================================================');
    if (originalEvent && (sourceId != targetId)) {
	    vueApp.moveTarget(sourceId, targetId);
    }
	});
	instancePlumb.bind("connectionDetached", function (info, originalEvent) {
    console.log(info);
	});

	let vueApp = new Vue({
		el: '#app',
		data: {
			exampleGreyEndpointOptions : {
			  endpoint:"Rectangle",
			  paintStyle:{ width:25, height:21, fill:'#666' },
			  isSource:true,
			  connectorStyle : { stroke:"#666" },
			  isTarget:true,
			  beforeDetach: function (conn) {
		      return confirm("Detach connection?");
		    }
			},
			codeNode: '{}'
		},

		methods: {
			generateGraph () {
				document.getElementById('tree').innerHTML = '';
				
				let jsonCode = (typeof this.codeNode == 'string') ? JSON.parse(this.codeNode) : this.codeNode;
				// console.log('-- Начало генерации графа --');
				
				for (key in jsonCode) {
					let pos = [jsonCode[key].position.left, jsonCode[key].position.top];
					let newElement = this.generateNode(false, '', true, key, pos);
				}
				for (key in jsonCode) {
					if ( jsonCode[key].targets != '' ) {
						let targets = jsonCode[key].targets.split(',');
						// console.log("targets", targets);
						for (let i = 0; i < targets.length; i++) {
							console.log("key", key);
							console.log("targets[i]", targets[i]);
							instancePlumb.connect({uuids: [key, targets[i]]});
						};
					}
				}

					// console.log('-- Конец генерации графа --');
			},
			generateCode () {
				let jsonCode = (typeof this.codeNode == 'string') ? JSON.parse(this.codeNode) : this.codeNode;
		    jsonCode = 'нету кода';
			},
			createPoint () {
				let $this = event.target;
				instancePlumb.addEndpoint($this, { 
				  anchor:"Left"
				}, this.exampleGreyEndpointOptions);
			},
			createChild () {
				let sourceEl = event.target,
						data = this.generateNode(true, sourceEl.id),
						endPoint = instancePlumb.getEndpoint(sourceEl.id);
				instancePlumb.connect({ 
				  source:endPoint, 
				  target:data[0]
				});

			},
			moveTarget (sourceId, targetId) {
				// console.log("-- moveTarget begin --");
				let jsonCode = (typeof this.codeNode == 'string') ? JSON.parse(this.codeNode) : this.codeNode;
				if ( jsonCode[sourceId].targets != '') {
					if (jsonCode[sourceId].targets.indexOf(targetId) < 0) { jsonCode[sourceId].targets += ',' + targetId }
				} 
				else {
					jsonCode[sourceId].targets = targetId;
				}
				this.codeNode = JSON.stringify(jsonCode);
				
				// console.log("-- moveTarget end --");
			},
			setPosition (event) {
				console.log("event", event);
				let jsonCode = (typeof this.codeNode == 'string') ? JSON.parse(this.codeNode) : this.codeNode;
				
				let top = event.finalPos[0], left = event.finalPos[1];
				jsonCode[event.el.id].position.top = top;
				jsonCode[event.el.id].position.left = left;
				this.codeNode = JSON.stringify(jsonCode);
			},
			generateNode (child = false, targetEl = '', generate = false, elemId = '', pos = []) {
				let el = document.createElement('div');
				el.id = (elemId == '') ? "cont"+Math.floor(Math.random()*1001) : elemId;
				el.class = "myDrag";
				el.dataset.node="true";
				if (pos.length) {
					el.style.top = pos[0]+'px';
					el.style.left = pos[1]+'px';
				}
				el.addEventListener('dblclick', this.createChild);
				document.getElementById("tree").appendChild(el);
				instancePlumb.draggable(el, {
				   containment:true,
				   stop: this.setPosition
				});
				let point = instancePlumb.addEndpoint(el, { 
				  uuid:el.id,
				  anchor:"Bottom",
				  maxConnections: -1
				}, this.exampleGreyEndpointOptions);
				

				if (generate === false) {

					let newEl = {
								id: el.id,
								position: {
									top: 20,
									left: 100
								},
								targets: ''
							};

					let jsonCode = (typeof this.codeNode == 'string') ? JSON.parse(this.codeNode) : this.codeNode;
	
					if (child === true) {
						Vue.set(jsonCode, newEl.id, newEl);
						if ( jsonCode[targetEl].targets != '') {
							if (jsonCode[targetEl].targets.indexOf(newEl.id) < 0) { jsonCode[targetEl].targets += ',' + newEl.id }
						} 
						else {
							jsonCode[targetEl].targets = newEl.id;
						}
						// console.log("jsonCode[targetEl].targets", jsonCode[targetEl].targets);
						// Vue.set(jsonCode[targetEl].targets, newEl.id, newEl.id);
						this.codeNode = JSON.stringify(jsonCode);
					}
					else {
						Vue.set(jsonCode, newEl.id, newEl);
						this.codeNode = JSON.stringify(jsonCode);
					}	
				}

				let data = [point, el];
				return data;
			}
		}
	});
}