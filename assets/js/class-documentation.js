function ClassDocumentationGenerator(container, classInfo)
{
    const ANCHOR_CONSTANTS = 'constants';
    const ANCHOR_PROPERTIES = 'properties';
    const ANCHOR_CONSTRUCTOR = 'constructor';
    const ANCHOR_METHODS = 'methods';

    const DF_MODIFICATION_COLOR_TEXT = '34495e';
    const DF_MODIFICATION_COLOR_BG = '34495e';
    const MODIFICATION_COLOR = {
        'public': {
            text: '#2980b9',
            bg: ''
        },
        'protected': {
            text: '#d35400',
            bg: ''
        },
        'private': {
            text: '#c0392b',
            bg: ''
        }
    };

    this.$container = $(container);
    this.classInfo = classInfo;

    function orderFunc(a, b) {
        var orders = {
            'public': 1,
            'protected': 2,
            'private': 3,
        };
        var aOrder = orders.hasOwnProperty(a.modification) ? orders[a.modification]: 0;
        var bOrder = orders.hasOwnProperty(b.modification) ? orders[b.modification]: 0;

        return aOrder === bOrder ? 0 : (aOrder > bOrder ? 1 : -1);
    }

    function navItem($con, label, anchor) {
        anchor = typeof anchor === "undefined" ? "" : anchor;
        $con.append($('<div class="doc-item"><a href="#'+ anchor +'" class="doc-item-link">'+ label +'</a></div>'));
    }

    function newSection(title, identifier)
    {
        var $section = $('<div class="section c-mb-32 ' + identifier + '-section" id="' + identifier + '-section"></div>');
        $section.append('<h5 class="section-title" id="' + identifier + '">' + title + '</h5>');
        //$section.append('<hr/>');
        $section.append('<div class="section-container"></div>');
        return $section;
    }

    function generateNavBar(classInfo)
    {
        var $navbar = $('<nav class="collapse show doc-nav" aria-label="Class Documentation Navigation"></nav>');
        navItem($navbar, 'Constants', ANCHOR_CONSTANTS);
        navItem($navbar, 'Properties', ANCHOR_PROPERTIES);
        navItem($navbar, 'Constructor', ANCHOR_CONSTRUCTOR);
        navItem($navbar, 'Methods', ANCHOR_METHODS);

        return $navbar;
    }

    function displayType(propertyType)
    {
        return propertyType.split('|').map(function (item) {
            return '<code class="type-tag">' + item + '</code>';
        }).join(', ');
    }

    function printProperty(property)
    {
        var modificationColor = '#34495e';
        if (MODIFICATION_COLOR.hasOwnProperty(property.modification)) {
            modificationColor = MODIFICATION_COLOR[property.modification].text;
        }

        return '<div>' +
            '<code style="color: ' + modificationColor + '">' + property.modification + '</code> ' +
            (property.is_static ? '<code style="color: #8e44ad">static</code> ' : '') +
            '<code>$' + property.name + '</code>' +
            '</div>' +
            '<div>' + displayType(property.type) + '</div>' +
            '<div>Default: <code class="type-tag">' + property.default_value + '</code></div>' +
            '<div>' +
            (property.is_magic ? '<span class="text-danger">[Magic property]</span> ' : '') + property.desc +
            '</div>';
    }

    function printConstant(constant) {
        return '<code>' + constant.name + '</code>: <code class="type-tag">' + constant.value + '</code><br>' +  displayType(constant.type) + '<br>' + constant.desc;
    }

    function generateConstantSection(constants)
    {
        var $section = newSection('1. Constants', ANCHOR_CONSTANTS);
        $section.find('.section-container').append('<ul class="constant-list"></ul>');
        var $con = $section.find('.section-container ul.constant-list');

        for (var i = 0; i < constants.length; i++) {
            $con.append('<li class="c-mb-8">' + printConstant(constants[i]) + '</li>');
        }

        return $section;
    }

    function generatePropertySection(properties)
    {
        properties = properties.sort(orderFunc);

        var $section = newSection('2. Properties', ANCHOR_PROPERTIES);
        $section.find('.section-container').append('<ul class="property-list"></ul>');
        var $con = $section.find('.section-container ul');

        for (var i = 0; i < properties.length; i++) {
            $con.append('<li id="' + ANCHOR_PROPERTIES + '-' + properties[i].name + '">' + printProperty(properties[i]) + '</li>');
        }

        return $section;
    }

    function displayParameter(parameter) {
        return '<div><div>' +
            '<code>$' + parameter.name + '</code> ' +
            '<span>' + parameter.desc + '</span>' +
            '</div><div>Type: ' + displayType(parameter.type) + '</div>' +
            (parameter.has_default_value ? 'Default: <code class="type-tag">' + parameter.default_value + '</code>' : '') +
            '</div>';
    }

    function displayParameters($con, params) {
        $con.append('<div class="c-mt-16"><b>Parameters</b></div>');
        $con.append('<ul class="param-list"></ul>');
        var $paramList = $con.find('ul.param-list');

        for (var i = 0; i < params.length; i++) {
            var param = params[i];
            $paramList.append('<li class="param-item c-mb-8">' + displayParameter(param) + '</li>');
        }
    }

    function displayExceptions($con, exceptions) {
        $con.append('<div class="c-mt-16"><b>Exceptions</b></div>');
        $con.append('<ul class="exception-list"></ul>');
        var $exceptionList = $con.find('ul.exception-list');

        for (var j = 0; j < exceptions.length; j++) {
            var exception = exceptions[j];
            $exceptionList.append('<li class="exception-list c-mb-8">' + displayType(exception.type) + ' ' + exception.desc + '</li>');
        }
    }

    function generateConstructorSection(constructor)
    {
        var $section = newSection('3. Constructor', ANCHOR_CONSTRUCTOR);
        var $con = $section.find('.section-container');
        $con.append('<div>' + constructor.desc + '</div>');
        $con.append('<div><code>' + constructor.code + '</code></div>');

        if (constructor.params.length > 0) {
            displayParameters($con, constructor.params);
        }

        if (constructor.exceptions.length > 0) {
            displayExceptions($con, constructor.exceptions);
        }

        return $section;
    }

    function displayMethod(method) {
        var $con = $('<div class="method-item"></div>');
        $con.append('<div><code>' + method.code + '</code></div>');
        $con.append('<div>' + method.desc + '</div>');
        $con.append('<div>Return: ' + displayType(method.return) + '</div>');

        if (method.params.length > 0) {
            displayParameters($con, method.params);
        }
        if (method.exceptions.length > 0) {
            displayParameters($con, method.exceptions);
        }

        return $con;
    }

    function generateMethodSection(methods) {
        methods = methods.sort(orderFunc);
        var $section = newSection('4. Methods', ANCHOR_METHODS);
        var $con = $section.find('.section-container');
        $con.addClass('method-list');

        for (var i = 0; i < methods.length; i++) {
            $con.append(displayMethod(methods[i]));
        }

        return $section;
    }

    this.$container.append('<div class="nav-container"></div><div class="content pb-3 pl-3 pr-3"></div>');

    this.$navBar = generateNavBar(this.classInfo);
    this.$container.find('.nav-container').append(this.$navBar);

    var $content = this.$container.find('.content');

    $content.append('<div class="class-info shadow-sm border-bottom p-3">' +
        '<h3>' + this.classInfo.name + '</h3>' +
        '<div>Namespace: <code class="type-tag">' + this.classInfo.namespace + '</code></div>' +
        '<p class="mb-0">' + this.classInfo.desc + '</p>' +
        '</div>');

    this.$constantSection = generateConstantSection(this.classInfo.constants);
    $content.append(this.$constantSection);

    this.$propertySection = generatePropertySection(this.classInfo.properties);
    $content.append(this.$propertySection);

    this.$constructorSection = generateConstructorSection(this.classInfo.constructor);
    $content.append(this.$constructorSection);

    this.$methodsSection = generateMethodSection(this.classInfo.methods);
    $content.append(this.$methodsSection);

    $(document).find('title').text(this.classInfo.name + " - Class Documentation");

    setTimeout(function () {
        $('#doc-container .content').css({
            'padding-top': $('#doc-container .content .class-info').outerHeight() + 36
        });
    });
}

ClassDocumentationGenerator.prototype.addNavItem = function(label, anchor)
{
    anchor = typeof anchor === "undefined" ? "" : anchor;
    this.$navBar.append($('<div class="doc-item"><a href="#'+ anchor +'" class="doc-item-link">'+ label +'</a></div>'));
};