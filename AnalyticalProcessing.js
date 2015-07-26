if (type include=="undefined")
{
	include("bower_components/sortable/css/sortable-theme-slick.css");
//	include("bower_components/sortable/js/sortable.min.js");
	include("bower_components/sortable/js/sortable.js");
	
}
var AP={
	distinct:function(data,methodfunc,callback)
	{
		var map={};
		var out=[];
		for (var i=0;i<data.length;i++)
		{
			var str=methodfunc(data[i]);
			if (map[str]) continue;
			map[str]=true;
			out.push(data[i]);
		}
		delete map;
		return callback(out);
	}
	,table:function($obj,col,data,option)
	{		
		if (!option) option={};
		if (!data)
		{
			data=arguments[2]=arguments[1];
			col=arguments[1]=null;
		}
		if (!col)
		{
			col=[];
			for (var i in data[0]) col.push(i);
		}
		{
			if (!option.keepcol) option.keepcol=[];
			var map={};
			option.keepcol.forEach(function(v){map[v]=true;});
			col.forEach(function(v){
				if (!map[v]) option.keepcol.push(v);
			});
		}
		var d1=AP.roll_up(option.keepcol,data);
		if(option.title) $("<label>").text(option.title).appendTo($obj);
		var $table=$("<table class='sortable-theme-slick' data-sortable >").appendTo($obj);
		{
			var $tr=$("<tr>").appendTo( $("<thead>").appendTo($table)  );
			for (var j=0;j<col.length;j++)
			{			
				var $tmp=$("<th>").appendTo($tr).text(col[j]);
				if (option.thfunc) option.thfunc($tmp,col[j]);
			}
			var $tmp=$("<th>").appendTo($tr).text("数量");
			if (option.thfunc) option.thfunc($tmp,"数量");
		}
		var $tbody=$("<tbody>").appendTo($table);
		for (var i=0;i<d1.length;++i)
		{
			var $tr=$("<tr>").appendTo($tbody);
			for (var j=0;j<col.length;j++)
			{
				var $tmp=$("<td>").appendTo($tr).text(d1[i][col[j]]);
				if (option.tdfunc) option.tdfunc($tmp,col[j],d1[i]);
			}
			var text="";if (d1[i]["@count"]!=1) text="x"+d1[i]["@count"];
			var $tmp=$("<td>").appendTo($tr).text(text);
			if (option.tdfunc) option.tdfunc($tmp,"@count",d1[i]);
		}
		$("<label>").appendTo($obj).text("total:"+data.length);
		if (typeof Sortable!="undefined") 
		{
			Sortable.init();
			Sortable.initTable($table);
		}
		return d1;
	}	
	,table_2D:function ($base,data,str,x,y,z)
	{
		var sx=x,sy=y,sz=z;
		if (typeof x=="string") x=function(obj){return obj[sx];}
		if (typeof y=="string") y=function(obj){return obj[sy];}
		if (typeof z=="string") z=function(obj){return obj[sz];}
		if (x==null) x=function(obj,i){return"ALL";}
		if (y==null) y=function(obj,i){return "ALL";}
		if (z==null) z=function(obj,i){return 1;}
		var tx,ty,tz;
		var map={},xmap={},ymap={};
		for (var i=0;i<data.length;i++){
			tx=x(data[i],i);ty=y(data[i],i);tz=z(data[i],i);
			xmap[tx]=tx;ymap[ty]=ty;
			if (!map[tx]) map[tx]={};if (!map[tx][ty]) map[tx][ty]={sum:0,num:0};
			map[tx][ty].num++;map[tx][ty].sum+=tz;
		}
		var $table=$("<table class='table_2D' >").appendTo($base);
		var $tr=$("<tr>").appendTo($table).append("<td>"+str+"</td>");			
		for (ty in ymap) $tr.append("<td>"+ty+"</td>");
		for (tx in xmap)			
		{
			var $tr=$("<tr>").appendTo($table);
			$tr.append("<td>"+tx+"</td>");
			for (ty in ymap) if (!map[tx][ty]) $tr.append("<td>");else
			{
				var num=map[tx][ty].sum/map[tx][ty].num;
				num=num.toFixed(2);
				$("<td>").append(""+num).appendTo($tr);
			}
		}
	}
	,load:function(path,callback)
	{
		var fs=require("fs");
		fs.readFile(path,"utf-8",function(err,data){
			data="["+data.substr(1)+"]";
			data=JSON.parse(data);
			return callback(data);
		});
	
	}
	,join:function(dataa,datab,col,joinfunc)
	{			
		if (!joinfunc) joinfunc=function(a,b){
			var res={};
			for (var i in a) res["a_"+i]=a[i];
			for (var i in b) res["b_"+i]=b[i];
			return res;
		}
		if (typeof col=="string") col=[col];
		function colstr(a)
		{
			var res="";
			col.forEach(function(col)
			{
				res+=a[col]+"#";
			});
			return res;
		}
		var map={};
		dataa.forEach(function(a)
		{
			var c=colstr(a);
			if (!map[c]) map[c]=[];
			map[c].push(a);
		});
		var res=[];
		datab.forEach(function(b)
		{
			var c=colstr(b);
			if (!map[c]) return;
			map[c].forEach(function(a){
			var ret=joinfunc(a,b);
			if (ret) res.push(ret);
			});
		});
		return res;
	}	
	,roll_up:function(dig,datas,wth)
	{		
		if (!wth) wth=[];		
		if (typeof(wth)=="string") wth=[wth];
		if (wth instanceof Array)
		{			
			var tmp={};
			for (var i=0;i<wth.length;i++)
				tmp[wth[i]]=true;
			wth=tmp;
		}		
		////////
		{
			var digg={};
			for (var i=0;i<dig.length;i++) digg[dig[i]]=true;
			dig=digg;
		}
		for (var k in wth) delete dig[k];
		//console.log("dig",JSON.stringify(dig));
		var map={pointer:-1,child:[]};
		var ans=[];
		for (var i=0;i<datas.length;i++)
		{
			var obj=map;
			var json={"@count":0};
			for (var key in dig)
			{
				var val=datas[i][key];
				json[key]=val;
				if (!obj.child[val]) obj.child[val]={pointer:-1,child:[]};
				obj=obj.child[val];
			}
			if (obj.pointer<0)
			{
				obj.pointer=ans.length;
				ans.push(json);
			}else json=ans[obj.pointer];
			if (datas[i]["@count"])  json["@count"]+=datas[i]["@count"];else json["@count"]++;
			for (var key in wth) 
				if (typeof(json["@"+key+"_sum"]) == "undefined") 
						json["@"+key+"_sum"]=datas[i][key];
				else	json["@"+key+"_sum"]+=datas[i][key];
		}
		var ttcount=0;
		for (var i=0;i<ans.length;i++) ttcount+=ans[i]["@count"];
		console.log(ans);
		console.log("ttcount",ttcount);		
		for (var i=0;i<ans.length;i++) 
		{
			ans[i]["@rate"]=ans[i]["@count"]/ttcount;
			for (var key in wth)
			{
				ans[i]["@"+key+"_mean"]=ans[i]["@"+key+"_sum"]/ans[i]["@count"];
				if (wth[key]=="mean") ans[i][key]=ans[i]["@"+key+"_mean"];
			}
			
			ans[i]["@num"]=i;
		}
		return ans;
	}
	,relabel:function(data,fn,col)
	{
		var ans=[];
		if (!col) {col=[];for (var i in data[0]) if (i.charAt(0)!="@") col.push(i);}		
		for (var i=0;i<data.length;i++) {var obj=JSON.parse(JSON.stringify(data[i]));if (fn(obj)) ans.push(obj);}		
		return AP.roll_up(col,ans);
	}
	,sync_foreach:function(data,callback)
	{
		for (var i=0;i<data.length;i++)	callback(i,data[i]);
	}
	,min:function(data,method)
	{
		var ans,first=true;
		AP.sync_foreach(data,function(key,value){
			if (first || ans>value[method]) ans=value[method];first=false;
		});
		return ans;
	}
	,max:function(data,method)
	{
		var ans,first=true;
		AP.sync_foreach(data,function(key,value){
			if (first || ans<value[method]) ans=value[method];first=false;
		});
		return ans;
	}	
	,filter:function(data,fn)
	{
		var ans=[];
		for (var i=0;i<data.length;i++) if (fn(data[i])) ans.push(data[i]);
		return ans;
	}
	,Tuple2point:function (data,method,col) //WARN.应淘汰
	{			
			if (!method) method="@count";
			var count=0;
			for (var i=0;i<data.length;i++)
				count+=data[i].count;
			if (!col)
			{
				col=[];for (var i in data[0]) if (i!=method && i[0].charAt(0)!="@") col.push(i);
			}			
			var ans=[];			
			for (var i=0;i<data.length;i++)
			{
				var obj=[];
				for (var j=0;j<col.length;j++)obj.push(data[i][col[j]]);
				obj.push(data[i][method]);
				ans.push(obj);
			}
			return ans;
	}
	,Tuple2array:function (data,col) //WARN.应淘汰
	{						
			var count=0;for (var i=0;i<data.length;i++) count+=data[i].count;
			if (typeof col =="string") col=[col];
			if (!col)
			{
				col=[];for (var i in data[0]) if (i!=method && i[0].charAt(0)!="@") col.push(i);
			}			
			var ans=[];			
			for (var i=0;i<data.length;i++)
			{
				var obj=[];
				for (var j=0;j<col.length;j++)obj.push(data[i][col[j]]);
				ans.push(obj);
			}
			return ans;
	}	
};