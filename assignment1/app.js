/**
 * Created by DimaKorn on 7/18/15.
 */

var App={};

App.VERTICES={
    "1": [
        vec2( -0.5, -0.5 ),
        vec2(  0,  0.5 ),
        vec2(  0.5, -0.5 )
    ],
    "2":[
        vec2(-0.5,-0.5),
        vec2(-0.5,0.5),
        vec2(0.5,0.5),
        vec2(0.5,0.5),
        vec2(0.5,-0.5),
        vec2(-0.5,-0.5)
    ]

}
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
        this.uMode=gl.getUniformLocation(program,"uMode");
        gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
        gl.enableVertexAttribArray( vPosition );
        this.isInitialised=true;

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
        gl.uniform1i(this.uMode,renderMode);
        gl.drawArrays(renderMode==App.Conf.RenderModes.WIRE? gl.LINES:gl.TRIANGLES, 0, points.length );
        gl.disableVertexAttribArray(vPosition);
    }
}
App.Conf={
    TesselationLevels:[1,2,3,4,5,6,7,8,9,10],

    RenderModes:{
        FILL:1,
        WIRE:2
    },

    Shapes:{
        TRIANGLE:1,
        SQUARE:2,
        STAR:3
    }
}
App.Tesselator={
    resultPoints:[],
    tesselate:function(settings,vertices)
    {
        this.resultPoints=[];
        this.renderMode=settings.RenderMode;
        this.radAngel=settings.TwistAngel/(2*Math.PI);
        for(var i=0;i<vertices.length;i+=3){
            this.divideTriangle(vertices[i],vertices[i+1],vertices[i+2],settings.TesselationLevel,settings.TwistAngle);
        }
        return this.resultPoints;
    },
     divideTriangle:function( a, b, c, count,twistAngel )
    {

    // check for end of recursion

    if ( count === 0 ) {
        var points=[a,b,c];
        var radAngel=this.radAngel;
        var result= points.map(function(p){
            var d=Math.sqrt(p[0]*p[0]+p[1]*p[1]);
            var finalAngel=d*radAngel;
            var dCos=Math.cos(finalAngel);
            var dSin=Math.sin(finalAngel);
            return vec2(p[0]*dCos-
                p[1]*dSin,p[0]*dSin+p[1]*dCos);
        })
        this.triangle(result[0],result[1],result[2]);
        // triangle( a, b, c );
    }
    else {

        //bisect the sides

        var ab = mix( a, b, 0.5 );
        var ac = mix( a, c, 0.5 );
        var bc = mix( b, c, 0.5 );

        --count;

        // four new triangles

        this.divideTriangle( a, ab, ac, count );
        this.divideTriangle( c, ac, bc, count );
        this.divideTriangle( b, bc, ab, count );
        this.divideTriangle(ab,bc,ac,count);
    }


    },
      triangle:function(a,b,c){
          if(this.renderMode==App.Conf.RenderModes.WIRE)
          this.resultPoints.push( a, b, b, c,c,a );
          else
          this.resultPoints.push(a,b,c);
      }



}
App.RendererSettings=Backbone.Model.extend({
    defaults:{
        TesselationLevel:5,
        TwistAngel:15,
        RenderMode:App.Conf.RenderModes.WIRE,
        Shape:App.Conf.Shapes.TRIANGLE

    }
});

App.MainView=Backbone.View.extend({
    el:"#content",
    events:{
        "change input":"onInputChange",
        "click button":"renderFull"

    },
    onMouseDown:function(e){
      console.log(e);
    },
    initialize:function(){
        this.listenTo(this.model,"change",this.render);
    },
    onInputChange:function(ev){
        var target=ev.target;
        var dataProp=target.dataset.relatedProp;
        if(target.type=="radio")
        {
            if(target.checked)
            this.model.set(dataProp,target.value);
        }
        else {
        this.model.set(dataProp,target.value);
        }
    },
    setSimpleValue:function(elem,propName,val){
        if(elem.val()!=val)
            elem.val(val);
    },
    setRadioValue:function(elems,propName,val){
        var selector="#"+propName+"_"+val;
        var target=elems.filter(selector);
        if(!target.prop("checked")){
            target.prop("checked",true);
        }
    },
    renderFull:function(){
      this.render(true);
    },
    render:function(full){
        if(!App.Renderer.isInitialised){
            App.Renderer.init(this.el.getElementsByTagName("canvas")[0]);
        }
        for(var prop in this.model.attributes)
        {

            var propInput=this.$el.find("input[data-related-prop='"+prop+"']");
            if(propInput)
            {
                if(propInput.is(":radio"))
                {
                    this.setRadioValue(propInput,prop,this.model.get(prop))
                }
                else
                {
                    this.setSimpleValue(propInput,prop,this.model.get(prop));
                }
            }
            var propSpan=this.$el.find("span[data-related-prop='"+prop+"']");
            if(propSpan)
            {
                propSpan.find("span").text(this.model.get(prop));
            }


        }
        if(!!full)
        {
        var points=App.Tesselator.tesselate(this.model.attributes,App.VERTICES[this.model.get("Shape")]);
        App.Renderer.render(points,this.model.get("RenderMode"));
        }
    }
})