autowatch = 1
inlets = 1;
outlets = 5;

var Object_next = -1
var Object_list = []
var Globals_next = 0
var Globals = []
var Activator_next = 0
var Activator_list = []
var Parameter_next = 0

// ---------------------- Global Methods
function import_script(s){
	var l,a,c;
	var f = new File(s)
    var evaluate;

    Object_next = -1
    Object_list = []
    Globals_next = 0
    Globals = []
    Activator_next = 0
    Activator_list = []
    Parameter_next = 0

	if (f.isopen) {
		l=-1;
		while (a=f.readline()) { // returns a string
           evaluate=a.split(" ");
		   type_command = evaluate[0]
           if(type_command != "//") {
            if (type_command == "moveto") {
	         Object_next++;
  	         Object_list.push(new Object_item(Object_next,a,l));
	        } else {
              if (Object_next>=0) {	         
			  switch (type_command)
			  {
			   case "@":
			    // Activator line
			    l=l-1
			    Activator_list.push(new Activator(Activator_next,Object_next,1))
			    Activator_next++
			    Object_list[Object_next].update_activators(1);
  			   break;
			   case "!":
			    // Parametric line
			    l=l-1
			    b=a.slice(2,100)
			    outlet(1, Parameter_next, l ,b)
			    Parameter_next++
			   break;
			   case "%s":
			    // Dynamic start delimiter
			    l=l-1
			   break;
			   case "%e":
			    // Dynamic end delimiter
			    l=l-1
			   break;
			   case "glflush":
			    // Flushing not to be bound to objects
			    l=l-1
			   break;
			   default:
			    // Main static line
			    Object_list[Object_next].addline(l, a, 1, 0, "", 1);
			  } 		  
			   } else {
               Globals.push(new Object_line())
               Globals[Globals_next].update_abolute_id(l)   
               Globals[Globals_next].update_main_line(a)
               Globals[Globals_next].update_activator_state(1)
               Globals[Globals_next].update_param_toggle(0)
               Globals[Globals_next].update_param_string("")
               Globals[Globals_next].update_dynamic_toggle(1) 
               Globals_next++
              }
	        }
			l++;
         }
		}
		f.close();
		dump()
		// Publish location matrix size
		var Object_number = Object_next + 1
		outlet(3,'dim',Object_number,1)
		// Prepare location matrix
		outlet(3,'setall', 0)
		for (var k=0;k<=Object_next;k++){
         outlet(2,k,Object_list[k].locate())
		}
		outlet(3,'bang')
		outlet(4,'import_done')
	} else {
		post("could not open file: " + s + "\n");
	}
}


function print() {
     for (var k = 0; k < Globals_next; k++) {
      Globals[k].print()
	 }
     for (var k = 0; k < Object_next; k++) {
      Object_list[k].print()
	 }
}

function print_activator() {
     for (var k = 0; k < Activator_next; k++) {
      Activator_list[k].print()
	 }
}

function set_activator(id, new_value) {
    var candidate_id = -1
    var selected_id = -1
    for (k=0;k<Activator_next;k++) {
     candidate_id = Activator_list[k].id
     if (candidate_id == id) {
	  selected_id = candidate_id
	  break
	 }
	}
    if (selected_id != -1) {
     Activator_list[selected_id].update(new_value)
     Object_to_update = Activator_list[selected_id].object_id
     Object_list[Object_to_update].update_activators(new_value) 
     Object_list[Object_to_update].send_cmd_update()
    }
}

function update_dynamic(new_state,object_nr) {
	if (new_state == 1) {
      Object_list[object_nr].update_dynamic(1)
	} else {
      Object_list[object_nr].update_dynamic(0)
	}	
}

function dump() {
     for (var k = 0; k < Globals_next; k++) {
      Globals[k].dump()
	 }
     for (var k = 0; k <= Object_next; k++) {
      Object_list[k].dump()
	 }
	 outlet(0, 'line', 'glflush')
}

function give_location() {
	// Publish location matrix size
	var Object_number = Object_next + 1
	outlet(3,'dim',Object_number,1)
	// Prepare location matrix
	outlet(3,'setall', 0)
	for (var k=0;k<=Object_next;k++){
        outlet(2,k,Object_list[k].locate())
	}
	outlet(3,'bang')
}

// ---------------------- OBJECT: OBJECT_ITEM
function Object_item(index, string, l) {
	this.index = index
	this.line = []
	this.line_next = 1

    // Init new object using the moveto string
    var interpret = string.split(" ")
    this.x = parseFloat(interpret[1])
    this.y = parseFloat(interpret[2])
    this.z = parseFloat(interpret[3])
    this.line.push(new Object_line)
    this.line[0].update_abolute_id(l)   
    this.line[0].update_main_line(string)
    this.line[0].update_activator_state(1)
    this.line[0].update_param_toggle(0)
    this.line[0].update_param_string("")
    this.line[0].update_dynamic_toggle(1)

    // If line is not moveto, add line to lines list
    this.addline = function(id, m_string, a_state, p_state, p_string, d_toggle) {
     this.line.push(new Object_line)
     this.line[this.line_next].update_abolute_id(id)   
     this.line[this.line_next].update_main_line(m_string)
     this.line[this.line_next].update_activator_state(a_state)
     this.line[this.line_next].update_param_toggle(p_state)
     this.line[this.line_next].update_param_string(p_string)
     this.line[this.line_next].update_dynamic_toggle(d_toggle) 
     this.line_next = this.line_next + 1         
	}

    this.update_activators = function(new_value) {
     for (var k = 0; k < this.line_next; k++) {
      this.line[k].update_activator_state(new_value)
	 }    	 
	}

	this.update_dynamic = function(new_value) {
     for (var k = 0; k < this.line_next; k++) {
      this.line[k].update_dynamic_toggle(new_value)
	  output_list = ["cmd_enable", this.line[k].line_abolute_id, new_value]
      outlet(0, 'line', output_list.join(" "))
   
	 }    	 
	}

    this.send_cmd_update = function() {
	var state_line = [-1, -1]
     for (var k = 0; k < this.line_next; k++) {
      state_line = this.line[k].dump_line_state()
      cmd_line = state_line[0]
      cmd_state = state_line[1]
	  output_list = ["cmd_enable", state_line[0], state_line[1]]
      outlet(0, 'line', output_list.join(" "))
     }
	}

    this.print = function() {
     post("index " + this.index + "\n")     
     post("X value " + this.x + "\n")     
     post("Y value " + this.y + "\n")     
     post("Z value " + this.z + "\n") 
     test_x_y_z = this.x + this.y + this.z;
     post("test " + test_x_y_z + "\n")    
     for (var k = 0; k < this.line_next; k++) {
      this.line[k].print()
	 }    
	}
	
    this.dump = function() {
     for (var k = 0; k < this.line_next; k++) {
      this.line[k].dump()
	 }    
	}
	
	this.locate = function() {
	 var location3D  = [this.x, this.y, this.z]
     return location3D     
	}
	
}

// ---------------------- OBJECT: OBJECT_LINE
function Object_line() {
    this.line_abolute_id
    this.line_main_line
    this.line_activator_state
    this.line_param_toggle
    this.line_param_string
    this.line_dynamic_toggle

    this.update_abolute_id = function(id) {
	 this.line_abolute_id = id
    }

    this.update_main_line = function(line) {
	 this.line_main_line = line
    }

    this.update_activator_state = function(state) {
	 this.line_activator_state = state
    }

    this.update_param_toggle = function(state) {
	 this.line_param_toggle = state
    }

    this.update_param_string = function(line) {
	 this.line_param_string = line
    }

    this.update_dynamic_toggle = function(state) {
	 this.line_dynamic_toggle = state
    }

    this.print = function() {
     post("this.line_abolute_id " + this.line_abolute_id + "\n")
     post("this.line_main_line " + this.line_main_line + "\n")
     post("this.line_activator_state " + this.line_activator_state + "\n")
     post("this.line_param_toggle " + this.line_param_toggle + "\n")
     post("this.line_param_string " + this.line_param_string + "\n")
     post("this.line_dynamic_toggle " + this.line_dynamic_toggle + "\n")
     post("\n")    
	}

    this.dump = function() {
	 if (this.line_activator_state == 1) {
      if (this.line_dynamic_toggle == 1) {
        outlet(0, 'line', this.line_main_line)
      }
     }
	}
	
	this.dump_line_state = function() {
	 var update_line = [this.line_abolute_id, this.line_activator_state]
     return update_line
    }
}

function Activator(id,object_id,value) {
	this.id = id
	this.value = value
	this.object_id = object_id
	
    this.update = function(new_value) {
     this.value = new_value
    }	

    this.print = function() {
     post("Activator_id " + this.id + " Object_id " + this.object_id + " Value = " + this.value + "\n")
	}
}