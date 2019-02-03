(function($) {

  var cocoon_element_counter = 0;

  var create_new_id = function() {
    return (new Date().getTime() + cocoon_element_counter++);
  }

  var newcontent_braced = function(id) {
    return '[' + id + ']$1';
  }

  var newcontent_underscord = function(id) {
    return '_' + id + '_$1';
  }

  var getNodeElem = function(node, traversalMethod, $this){

    if (!node){
      return $this.parent();
    }

    if (typeof node == 'function'){
      if(traversalMethod){
        console.warn('Traversal method is ignored, because node is given as a function.')
      }
      return node($this);
    }

    if(typeof node == 'string'){
      if (traversalMethod){
        return $this[traversalMethod](node);
      }else{
        return node == "this" ? $this : $(node);
      }
    }

  }

  $(document).on('click', '.add_fields', function(e) {
    e.preventDefault();
    var $this                 = $(this),
        assoc                 = $this.data('association'),
        assocs                = $this.data('associations'),
        content               = $this.data('association-insertion-template'),
        insertionMethod       = $this.data('association-insertion-method') || $this.data('association-insertion-position') || 'before',
        insertionNode         = $this.data('association-insertion-node'),
        insertionTraversal    = $this.data('association-insertion-traversal'),
        count                 = parseInt($this.data('count'), 10),
        regexp_braced         = new RegExp('\\[new_' + assoc + '\\](.*?\\s)', 'g'),
        regexp_underscord     = new RegExp('_new_' + assoc + '_(\\w*)', 'g'),
        new_id                = create_new_id(),
        new_content           = content.replace(regexp_braced, newcontent_braced(new_id)),
        new_contents          = [];


    if (new_content == content) {
      regexp_braced     = new RegExp('\\[new_' + assocs + '\\](.*?\\s)', 'g');
      regexp_underscord = new RegExp('_new_' + assocs + '_(\\w*)', 'g');
      new_content       = content.replace(regexp_braced, newcontent_braced(new_id));
    }

    new_content = new_content.replace(regexp_underscord, newcontent_underscord(new_id));
    new_contents = [new_content];

    count = (isNaN(count) ? 1 : Math.max(count, 1));
    count -= 1;

    while (count) {
      new_id      = create_new_id();
      new_content = content.replace(regexp_braced, newcontent_braced(new_id));
      new_content = new_content.replace(regexp_underscord, newcontent_underscord(new_id));
      new_contents.push(new_content);

      count -= 1;
    }

    var insertionNodeElem = getNodeElem(insertionNode, insertionTraversal, $this)

    if( !insertionNodeElem || (insertionNodeElem.length == 0) ){
      console.warn("Couldn't find the element to insert the template. Make sure your `data-association-insertion-*` on `link_to_add_association` is correct.")
    }

    $.each(new_contents, function(i, node) {
      var contentNode = $(node);

      var before_insert = jQuery.Event('cocoon:before-insert');
      insertionNodeElem.trigger(before_insert, [contentNode]);

      if (!before_insert.isDefaultPrevented()) {
        // allow any of the jquery dom manipulation methods (after, before, append, prepend, etc)
        // to be called on the node.  allows the insertion node to be the parent of the inserted
        // code and doesn't force it to be a sibling like after/before does. default: 'before'
        var addedContent = insertionNodeElem[insertionMethod](contentNode);

        insertionNodeElem.trigger('cocoon:after-insert', [contentNode]);
      }
    });
  });

  $(document).on('click', '.remove_fields.dynamic, .remove_fields.existing', function(e) {
    var $this            = $(this),
        removalNode      = null,
        removalTraversal = null;

    e.preventDefault();

    if( typeof $this.data('association-removal-node') != 'undefined' ) {
      removalNode      = $this.data('association-removal-node');
    } else {
      removalNode      = $this.data('wrapper-class') || '.nested-fields';
      removalTraversal = $this.data('association-removal-traversal') || 'closest';
    }

    var removalNodeElem = getNodeElem(removalNode, removalTraversal, $this);

    if( !removalNodeElem || (removalNodeElem.length == 0) ){
      console.warn("Couldn't find the element to remove. Make sure your `data-association-removal-*` on `link_to_remove_association` is correct.")
    }

    //var node_to_delete   = $this.closest('.' + wrapper_class);
    var trigger_node = removalNodeElem.parent();
    var before_remove = jQuery.Event('cocoon:before-remove');

    trigger_node.trigger(before_remove, [removalNodeElem]);

    if (!before_remove.isDefaultPrevented()) {
      var timeout = trigger_node.data('remove-timeout') || 0;

      setTimeout(function() {
        if ($this.hasClass('dynamic')) {
            removalNodeElem.detach();
        } else {
            $this.prev("input[type=hidden]").val("1");
            removalNodeElem.hide();
        }
        trigger_node.trigger('cocoon:after-remove', [removalNodeElem]);
      }, timeout);
    }
  });


  $(document).on("ready page:load turbolinks:load", function() {
    $('.remove_fields.existing.destroyed').each(function(i, obj) {
      var $this = $(this),
          wrapper_class = $this.data('wrapper-class') || '.nested-fields';

      $this.closest(wrapper_class).hide();
    });
  });

})(jQuery);


