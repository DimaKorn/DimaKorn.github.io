/**
 * Created by DimaKorn on 7/18/15.
 */

var App={};

App.Renderer={
    isInitialised:false,
    init:function(canvas){
        var gl=this.gl = WebGLUtils.setupWebGL( canvas );
        if ( !this.gl ) { alert( "WebGL isn't available" ); }
        var program=this.program = initShaders( gl, "vertex-shader", "fragment-shader" );
        this.gl.useProgram( program );
        this.gl.viewport( 0, 0, canvas.width, canvas.height );
        this.gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
        this.bufferId = this.gl.createBuffer();
        gl.bindBuffer( this.gl.ARRAY_BUFFER, this.bufferId );
        var vPosition =this.vPosition= gl.getAttribLocation( program, "vPosition" );
        this.LineColor=gl.getUniformLocation(program,"LineColor");
        gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
        gl.enableVertexAttribArray( vPosition );
        this.isInitialised=true;

    },
    renderLines:function(lines,color){
        var gl=this.gl;
        var vPosition=this.vPosition;
        var points=[];
        points=points.concat.apply(points,lines);
      //  var points=lines[0].concat(lines.slice(1,lines.length));
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.bufferId);
        this.gl.bufferData(gl.ARRAY_BUFFER,flatten(points),gl.STATIC_DRAW);
        gl.vertexAttribPointer(vPosition,2,gl.FLOAT,false,0,0);
        gl.uniform3f(this.LineColor,color[0],color[1],color[2]);
        this.gl.clear(gl.COLOR_BUFFER_BIT);
        var offsetIndex=0;
        for(var i=0;i<lines.length;++i)
        {
            var line=lines[i];
            gl.drawArrays(gl.LINE_STRIP,offsetIndex,line.length);
            offsetIndex+=line.length;

        }
      //  gl.drawArrays(gl.LINE_STRIP,0,3);
       // gl.drawArrays(gl.LINE_STRIP,3,3);

    },
    render:function(points,renderMode){
        var gl=this.gl;
        var vPosition=this.vPosition;
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.bufferId);

        this.gl.bufferData( gl.ARRAY_BUFFER,flatten( points), gl.STATIC_DRAW );
        gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
        gl.enableVertexAttribArray( vPosition );
        this.gl.clear( gl.COLOR_BUFFER_BIT );
        // gl.drawElements(gl.LINE_STRIP,lineIndices.length,gl.UNSIGNED_SHORT,0);

        gl.drawArrays( gl.LINES, 0, points.length );
        gl.disableVertexAttribArray(vPosition);
    }
}

App.Scene=Backbone.Model.extend({
    initialize:function(options){
        this.lines=[];
        this.isTracking=false;
        this.set("color",[0.0,1.0,0.0]);
    },

    startLine:function(p){
        this.lines.push([p]);
        this.isTracking=true;

    },
    addPoint:function(p){
        if(this.isTracking)
        {
        this.lines[this.lines.length-1].push(p);
        }
    },
    endLine:function(p){
        this.lines[this.lines.length-1].push(p);
        this.isTracking=false;
    },
    getLines:function(){
        return this.lines;
    },
    setColor:function(text){
        var reg=/#([\da-fA-F]{2})([\da-fA-F]{2})([\da-fA-F]{2})/;
        var matches=reg.exec(text);
        var color=[];
        for(var i=1;i<=3;++i)
        {
            var digit=parseInt(matches[i],16);
            color.push(digit/255);
        }
       this.set("color",color);

    }


});


App.MainView=Backbone.View.extend({
    el:"#content",
    events:{
        "mousedown canvas":"onMouseDown",
        "mouseup canvas":"onMouseUp",
        "mousemove canvas":"onMouseMove",
        "change #color":"onColorChange"
    },
    initialize:function(){
        this.listenTo(this.model,"change",this.render);
        this.isTracking=false;

    },
    mapToViewport:function(p,el){
        var x= p.x;
        var y= p.y;
        var relX=x-el.offsetLeft;
        var relY=y-el.offsetTop;
        if(relX<0 || relY<0)
        return null;
        var ndcX=(2*relX-el.offsetWidth)/el.offsetWidth;

        var ndcY=-(2*relY-el.offsetHeight)/el.offsetHeight;
        return vec2(ndcX,ndcY);


    },
    onColorChange:function(ev){
      this.model.setColor(ev.target.value);
        this.render();
    },
    onMouseDown:function(ev){
        this.isTracking=true;
        var vec=this.mapToViewport({x:ev.clientX,y:ev.clientY},ev.target);
        if(vec)
        {
           this.model.startLine(vec);
        }
        this.render(true);
    },
    onMouseUp:function(ev){
        this.isTracking=false;
        var vec=this.mapToViewport({x:ev.clientX,y:ev.clientY},ev.target);
        if(vec){
            this.model.endLine(vec);
        }
        this.render(true);
    },
    onMouseMove:function(ev){
        var vec=this.mapToViewport({x:ev.clientX,y:ev.clientY},ev.target);
        if(vec)
        {
            this.model.addPoint(vec);
        }
        this.render(true);
    },
    render:function(full){
        if(!App.Renderer.isInitialised){
            App.Renderer.init(this.el.getElementsByTagName("canvas")[0]);
        }
        //App.Renderer.renderLines([[vec2(0,0),vec2(0.1,0.2),vec2(0.2,0.5)],[vec2(0,0),vec2(0.2,0.1),vec2(1,1)]]);
        App.Renderer.renderLines(this.model.getLines(),this.model.get("color"));
    }
})