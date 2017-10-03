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

function delete_beer(id, name, button) {
    if (confirm("Are you sure you want to delete " + name + "?") == true) {
        var req = new XMLHttpRequest();
        var payload = {};
        payload.id = id;
        req.open('DELETE', 'http://localhost:6576/beer', true);
        req.setRequestHeader('Content-Type', 'application/json');
        req.addEventListener('load', function() {
            if (req.status >= 200 && req.status < 400) {
                console.log ('Beer Deleted');
                var row = button.parentNode.parentNode;
                row.remove(true);
            }
            else {
                console.log('Beer Deletion Failed');
            }
        });
        req.send(JSON.stringify(payload));
    }
}