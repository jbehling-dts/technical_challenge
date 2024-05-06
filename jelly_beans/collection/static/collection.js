// The delete functions need a csrf_token in the request header, so we'll just retrieve one from
// the first form of our document.
const csrf_token = document.querySelector('input[name="csrfmiddlewaretoken"]').value;

// Initialize the current_jar_index to null unless there is jar data. In that case, set it to 0.
// The current_jar_index will be used to determine which jar we are working with when we add beans to a jar.
// This value is set when the "Previous" and "Next" buttons are pressed.
let current_jar_index = null
if (jars_data.length > 0) {
    current_jar_index = 0
}

// We keep track of the current_flavor_id so we can know which flavor needs eddited within flavors_data after an edit.
// This variable is set whenever the edit button of a flavor is clicked
let current_flavor_id = null

// We keep track of the current_bean_id so we can know which bean needs eddited within the beans data of a jar after an edit.
// This variable is set whenever the edit button of a bean is clicked
let current_bean_id = null

$(document).ready(function() {
    // When the document is ready, we want to populate the jars div with the first jar, or the getting started instructions.
    if (current_jar_index != null) {
        moveJarToContainer(jars_data[current_jar_index])
    } else {
        getStarted()
    }

    // When the document is ready, populate the flavors accordion with the flavor elements
    $.each(flavors_data, function(index, value) {
        $("#flavors_accordion_content").append(createFlavorElement(value))
    })
})

// The get started function populates the jar div with instructions on how to begin. This function is only called when no jars exist.
function getStarted() {
    // Hide the jar buttons div
    $(".jar-buttons").hide()
    $("#jar-container").html(`
        <div style="margin-top: 20px;"><h3>Looks like your collection is empty!</h3>
        <button type="button" onclick="showJarCreate()">Click here to get Started!</button></div>
    `)
}

function showJarCreate() {
    $("#jar_modal_create").show();
}

// This function uses the jar information to create the jar element which contains:
// jar name, bean capacity, and the beans contained in that jar
function moveJarToContainer(jar) {
    jarBeansHtml = ''
    if (!jar) {
        return
    }
    // Show the jar buttons in case they are hidden (they are hidden if there were no jars initially)
    $(".jar-buttons").show()

    $.each(jar.beans, function(index, value) {
        let svgImg = createBeanElement(value)
        jarBeansHtml += svgImg
    })
    let numBeans = getNumOfBeansInJar(jar)
    jarContainerHtml = `
        <div class="jar-lid">
            <p>${jar.name} | <span id="numBeans">${numBeans}</span>/${jar.bean_capacity} Jelly Beans</p>
        </div>
        <div class="jar-body-outer"><div class="jar-body">

            <div class="jar-body-scroller"><div class="jar-body-scroller-content">
            ${jarBeansHtml}
            </div></div>
        </div></div>
    `
    $("#jar-container").html(jarContainerHtml)
}
function createBeanElement(bean) {
    // lighten the bean color by 50%. This variable will be used for the shiny part of the bean
    let lighterColor = shadeColor(bean.flavor.color, 80)  
    // determine the bean width and height based on the bean size value
    let beanWidthHeight = 80 * (bean.size * 0.7) 
    // creat the bean svg element  
    return `
        <svg class="jelly-bean" id="bean-${bean.id}" onclick="editBean(${bean.id})" height="${beanWidthHeight}px" width="${beanWidthHeight}px" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" 
        viewBox="0 0 512 512" xml:space="preserve">
        <path style="fill:${bean.flavor.color};" d="M261.332,0L261.332,0c96.855,0,170.306,87.444,153.71,182.993l-8.031,46.239
            c-3.076,17.712-3.076,35.823,0,53.535l8.031,46.239C431.637,424.556,358.186,512,261.333,512l0,0
            c-73.394,0-136.865-51.223-152.457-123.038l0,0c-19.022-87.618-19.022-178.305,0-265.923l0,0C124.466,51.223,187.937,0,261.332,0z"
            />
        <path style="fill:${bean.flavor.color};" d="M297.587,507.773c-11.599,2.754-23.728,4.227-36.254,4.227l0,0
            c-73.394,0-136.865-51.223-152.457-123.038l0,0c-19.022-87.618-19.022-178.305,0-265.923l0,0C124.466,51.223,187.937,0,261.332,0
            l0,0c12.526,0,24.655,1.474,36.254,4.227c-57.341,13.637-103.401,59.105-116.363,118.811l0,0
            c-19.022,87.618-19.022,178.305,0,265.923l0,0C194.186,448.668,240.246,494.136,297.587,507.773z"/>
        <path style="fill:${lighterColor};" d="M333.913,72.348c0,15.368-12.458,27.826-27.826,27.826s-27.826-12.458-27.826-27.826
            s12.458-27.826,27.826-27.826S333.913,56.98,333.913,72.348z M350.609,111.304c-9.22,0-16.696,7.475-16.696,16.696
            s7.475,16.696,16.696,16.696c9.22,0,16.696-7.475,16.696-16.696S359.829,111.304,350.609,111.304z"/>
        </svg>        
    `    
}
// Each flavor element contains the flavor name, color, and buttons for editing and deleting.
function createFlavorElement(flavor) {
    let $flavorElement = $(`
        <div id="flavor-${flavor.id}" class="flavor-row">
            <div style="width: 20%">
                <span>${flavor.name}</span>
                <div class="flavor-color" style="background-color: ${flavor.color}"></div>
            </div>
            <button type="button" onclick="editFlavor(${flavor.id})">Edit Flavor</button>
            <button type="button" onclick="deleteFlavor(${flavor.id})">Delete Flavor</button>
        </div>
    `)
    return $flavorElement
}

// These two functions will cycle the user through the jars. 
// If the next jar is out of index range, then show the first jar.
// If the previous jar is out of index range, then show the last jar.
function showPreviousJar() {
    current_jar_index -= 1
    if (current_jar_index >= 0) {
        moveJarToContainer(jars_data[current_jar_index])
    }
    else {
        current_jar_index = jars_data.length - 1
        moveJarToContainer(jars_data[current_jar_index])
    }
}
function showNextJar() {
    current_jar_index += 1
    if (current_jar_index < jars_data.length) {
        moveJarToContainer(jars_data[current_jar_index])
    }
    else {
        current_jar_index = 0
        moveJarToContainer(jars_data[current_jar_index])
    }
}

// Start of ajax requests:
// NOTE: The submit functions for each of the forms are contained in their respective snippets (templates/snippets)

// -------------------------
// Jar ajax requests:
// -------------------------
function editJar() {
    $.ajax({
        type: 'GET',
        url: `/jar-edit/${jars_data[current_jar_index].id}/`,
        headers: { 'X-CSRFToken': csrf_token },
        success: function(response) {
            $("#insert-jar-edit-form-here").html(response['html'])
            $("#jar_modal_edit").show()
        },
        error: function(xhr, status, error) {
            // Handle error response
        }
    });

}
function deleteJar(confirmDelete=false) {
    if (!confirmDelete) {
        $("#notification_modal-title").text('Confirm Delete')
        $("#insert-message-here").html(`
            <p>Deleting this Jar cannot be undone. Are you sure you want to continue?</p>
            <button type="button" onclick="deleteJar(true)">Delete</button>
        `)
        $("#notification_modal").show()
        return        
    }    
    var requestData = {
        id: jars_data[current_jar_index].id
    };

    $.ajax({
        type: 'POST',
        url: '/jar-delete/',
        contentType: 'application/json',
        headers: { 'X-CSRFToken': csrf_token },
        data: JSON.stringify(requestData),
        success: function(response) {
            // remove the deleted jar id from the jars_data array
            jars_data.splice(current_jar_index, 1)
            // subtract one from the current_jar_index since we removed one and show the next jar
            current_jar_index -= 1
            // check if there are any jars left
            if (jars_data.length == 0) {
                getStarted()
            } else{
                // check if the current_jar_index is less than zero
                if (current_jar_index < 0) {
                    current_jar_index = jars_data.length
                }
                showNextJar()
            }
            $("#notification_modal").hide()
        },
        error: function(xhr, status, error) {
            // Handle error response
        }
    });
}

// -------------------------
// Flavor ajax requests:
// -------------------------
function editFlavor(flavor_id) {
    current_flavor_id = flavor_id
    $.ajax({
        type: 'GET',
        url: `/flavor-edit/${flavor_id}/`,
        headers: { 'X-CSRFToken': csrf_token },
        success: function(response) {
            $("#insert-flavor-edit-form-here").html(response['html'])
            new JSColor(document.getElementById("id_edit-color"), {})
            $("#flavor_modal_edit").show()         
        },
        error: function(xhr, status, error) {
            // Handle error response
        }
    });

}

function deleteFlavor(flavor_id, confirmDelete=false) {
    current_flavor_id = flavor_id

    let numBeansWithCurrentFlavor = 0
    $.each(jars_data, function(jarIndex, jarValue) {
        $.each(jarValue.beans, function(beanIndex, beanValue) {
            if (beanValue.flavor.id == current_flavor_id) {
                numBeansWithCurrentFlavor += 1
            }            
        })
    })
    if (!confirmDelete) {
        $("#notification_modal-title").text('Confirm Delete')
        $("#insert-message-here").html(`
            <p>This flavor is associated with ${numBeansWithCurrentFlavor} bean(s). Deleting this flavor will 
            also delete those beans. Are you sure you want to continue?</p>
            <button type="button" onclick="deleteFlavor(${flavor_id}, true)">Delete</button>
        `)
        $("#notification_modal").show()
        return        
    }

    var requestData = {
        id: flavor_id
    };

    $.ajax({
        type: 'POST',
        url: '/flavor-delete/',
        contentType: 'application/json',
        headers: { 'X-CSRFToken': csrf_token },
        data: JSON.stringify(requestData),
        success: function(response) {
            let current_flavor_index = findFlavorIndexById(current_flavor_id)
            // remove the deleted flavor from the array
            flavors_data.splice([current_flavor_index], 1)
            // remove the flavor option from the create bean form
            $(`#id_create-flavor option[value="${current_flavor_id}"]`).remove()
            // remove the flavor from the flavor accordion
            $(`#flavor-${current_flavor_id}`).remove()
            // remove the beans with this flavor
            let bean_indexes_to_remove_from_array = []
            $.each(jars_data, function(jarIndex, jarValue){
                $.each(jarValue.beans, function(beanIndex, beanValue) {
                    if (beanValue.flavor.id == current_flavor_id) {
                        bean_indexes_to_remove_from_array.push([jarIndex, beanIndex])
                        $(`#bean-${beanValue.id}`).remove()
                    }
                })
            })
            // Remove beans from the jars_data array in reverse order
            for (let i = bean_indexes_to_remove_from_array.length - 1; i >= 0; i--) {
                const [jarIndex, beanIndex] = bean_indexes_to_remove_from_array[i];
                jars_data[jarIndex].beans.splice(beanIndex, 1);
            }
            // Update the bean count in the jar header, but only if a jar exists
            if (jars_data.legnth > 0) {
                updateJarBeanCount()
            }
            $("#notification_modal").hide()
        },
        error: function(xhr, status, error) {
            // Handle error response
        }
    });
}

// -------------------------
// Bean ajax requests:
// -------------------------
function editBean(bean_id) {
    current_bean_id = bean_id
    $.ajax({
        type: 'GET',
        url: `/bean-edit/${bean_id}/`,
        headers: { 'X-CSRFToken': csrf_token },
        success: function(response) {
            $("#insert-bean-edit-form-here").html(response['html'])
            $("#bean_modal_edit").show()         
        },
        error: function(xhr, status, error) {
            // Handle error response
        }
    });    
}
function deleteBean(confirmDelete=false) {
    if (!confirmDelete) {
        $("#notification_modal-title").text('Confirm Delete')
        $("#insert-message-here").html(`
            <p>Are you sure you want to eat this bean?</p>
            <button type="button" onclick="deleteBean(true)">Of Course!</button>
        `)
        $("#notification_modal").show()
        return        
    }       
    var requestData = {
        id: current_bean_id
    };

    $.ajax({
        type: 'POST',
        url: '/bean-delete/',
        contentType: 'application/json',
        headers: { 'X-CSRFToken': csrf_token },
        data: JSON.stringify(requestData),
        success: function(response) {
            let current_bean_index = findBeanIndexById(current_bean_id)
            jars_data[current_jar_index].beans.splice([current_bean_index], 1)
            $currentBeanPng = $(`#bean-${current_bean_id}`)
            $currentBeanPng.remove()
            // Update the bean count in the jar header
            updateJarBeanCount()
            $("#notification_modal").hide()
            $("#bean_modal_edit").hide()      
        },
        error: function(xhr, status, error) {
            // Handle error response
        }
    });
}

// End of ajax requests:

// Function to loop through and total the sizes of beans in the jar
function getNumOfBeansInJar(jar) {
    let numBeans = 0
    $.each(jar.beans, function(index, value) {
        numBeans += value.size
    })
    return numBeans
}
function updateJarBeanCount() {
    $("#numBeans").text(getNumOfBeansInJar(jars_data[current_jar_index]))
}
// When editing a jar, we need to validate that the new jar size will accomodate the existing beans
function jarHasEnoughRoom(createOrEdit) {
    let new_bean_size = parseInt($(`#id_${createOrEdit}-size`).val())
    let bean_capacity = jars_data[current_jar_index].bean_capacity
    let numBeans = getNumOfBeansInJar(jars_data[current_jar_index])
    bean_capacity -= numBeans
    // If we are editing a bean, we want to add the original current bean size so we can know how much room is available
    if(createOrEdit == 'edit') {
        let currentBeanIndex = findBeanIndexById(current_bean_id)
        bean_capacity += jars_data[current_jar_index].beans[currentBeanIndex].size
    }
    let roomLeftString = `The current jar only has room for ${bean_capacity} more bean(s).`
    if (new_bean_size > bean_capacity) {
        return [false, roomLeftString]
    } else {
        return [true, roomLeftString]
    }
}
function addBeanSizeErrorToForm(roomLeftString) {
    alert(roomLeftString) 
}
// Before adding a jelly bean to the jar, we need to make sure that some flavors exist first.
function openJellyBeanCreate() {
    if (flavors_data.length == 0) {
        $("#notification_modal-title").text('Create a Flavor First!')
        $("#insert-message-here").html(`
            <p>You haven't created any flavors yet! Please see the "Manage Flavors" accordion to create your flavors, 
            then you can add some jelly beans to the jar.</p>
        `)
        $("#notification_modal").show()
        return
    }
    $("#bean_modal_create").show()
}

function findFlavorIndexById(flavor_id) {
    let current_flavor_index = null
    $.each(flavors_data, function(index, value) {
        if (value.id == flavor_id) {
            current_flavor_index = index
        }
    })
    return current_flavor_index
}

function findBeanIndexById(bean_id) {
    let current_bean_index = null
    $.each(jars_data[current_jar_index].beans, function(index, value) {
        if (value.id == bean_id) {
            current_bean_index = index
        }
    })
    return current_bean_index
}

// This function is used to create a slightly lighter color for the part of the jelly bean that is shiny.
function shadeColor(color, percent) {

    var R = parseInt(color.substring(1,3),16);
    var G = parseInt(color.substring(3,5),16);
    var B = parseInt(color.substring(5,7),16);

    R = parseInt(R * (100 + percent) / 100);
    G = parseInt(G * (100 + percent) / 100);
    B = parseInt(B * (100 + percent) / 100);

    R = (R<255)?R:255;  
    G = (G<255)?G:255;  
    B = (B<255)?B:255;  

    R = Math.round(R)
    G = Math.round(G)
    B = Math.round(B)

    var RR = ((R.toString(16).length==1)?"0"+R.toString(16):R.toString(16));
    var GG = ((G.toString(16).length==1)?"0"+G.toString(16):G.toString(16));
    var BB = ((B.toString(16).length==1)?"0"+B.toString(16):B.toString(16));

    return "#"+RR+GG+BB;
}
