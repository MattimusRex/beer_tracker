$(document).ready(function() {
    $('#edit_modal').on('show.bs.modal', function (event) {
        var button = $(event.relatedTarget) // Button that triggered the modal
        var row = button.parent().parent();
        var cells = row.children();
        var modal = $(this);
        modal.find('.modal-body #beer_id').val(cells.eq(0).html());
        modal.find('.modal-body #beer_name').val(cells.eq(1).html());
        modal.find('.modal-body #beer_style').val(cells.eq(2).html());
        modal.find('.modal-body #beer_rating [value=' + cells.eq(3).html() + ']').prop('checked', true);
        modal.find('.modal-body #beer_review').val(cells.eq(4).html());
        modal.find('.modal-body #beer_location').val(cells.eq(5).html());
    })
});

$(document).ready(function() {
    $('#beer_table').DataTable();
});

function delete_beer(id, name) {
    if (confirm("Are you sure you want to delete " + name + "?") == true) {
        var req = new XMLHttpRequest();
        req.open('DELETE', 'https://localhost:6577/api/beers/' + id, true);
        req.setRequestHeader('Content-Type', 'application/json');
        req.addEventListener('load', function() {
            if (req.status >= 200 && req.status < 400) {
                document.getElementById(id).remove(true);
            }
            else {
                console.log('Beer Deletion Failed');
            }
        });
        req.send();
    }
}

function edit_beer() {
    var req = new XMLHttpRequest();
    req.open("POST", "https://localhost:6577/edit_beer", true);
    req.setRequestHeader("Content-Type", "application/json");
    var beer_id = document.getElementById("beer_id").value;
    var buttons = document.getElementsByName("beer_rating");
    var beer_rating;
    for (var i = 0; i < buttons.length; i++) {
        if (buttons[i].checked) {
            beer_rating = buttons[i].value;
        }
    }
    var payload = {};
    payload.beer_id = beer_id;
    payload.beer_name = document.getElementById("beer_name").value;
    payload.beer_style = document.getElementById("beer_style").value;
    payload.beer_rating = beer_rating;
    payload.beer_review = document.getElementById("beer_review").value;
    payload.beer_location = document.getElementById("beer_location").value;
    
    req.addEventListener("load", function() {
        if (req.status >= 200 && req.status < 400) {
            var cells = document.getElementById(beer_id).children;
            cells[1].innerHTML = document.getElementById("beer_name").value;
            cells[2].innerHTML = document.getElementById("beer_style").value;
            cells[3].innerHTML = beer_rating;
            cells[4].innerHTML = document.getElementById("beer_review").value;
            cells[5].innerHTML = document.getElementById("beer_location").value;
            $("#edit_modal").modal("hide");        
        }
        else {
            console.log("Beer Edit Failed");
        }
    });
    req.send(JSON.stringify(payload));
    
}

function validate_password(password) {
    // at least one number, one lowercase and one uppercase letter and at least 12 chars
    var re = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{12,}/;
    if (!re.test(password.value)) {
        alert("Your password must be at least 12 characters long and contain 1 number, 1 uppercase letter, and 1 lowercase letter.");
        password.focus();
        return false;
    }
    return true;
}