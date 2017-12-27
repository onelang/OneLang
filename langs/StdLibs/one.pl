package One;

sub str_replace
{
    my ($string, $find, $replace) = @_;

    my $pos = index($string, $find);

    while($pos > -1) {
        substr($string, $pos, length($find), $replace);
        $pos = index($string, $find, $pos + length($replace));
    }
    
    return $string;
}

package OneRegex;

sub matchFromIndex
{
    my ($pattern, $input, $offset) = @_;
    pos($input) = $offset;
    my @matches = ($input =~ /\G$pattern/g);
    my $result = scalar(@matches) ? \@matches : undef;
    return $result;
}

package OneClass;

sub new
{
    my $class = shift;
    my $self = {};
    bless $self, $class;
    my ( $name, $fields, $methods ) = @_;

    $self->{name} = $name;

    $self->{fields} = {};
    foreach my $field (@{$fields}) {
        $field->{cls} = $self;
        my $key = OneReflect::nameKey($field->{name});
        $self->{fields}{$key} = $field;
    }

    $self->{methods} = {};
    foreach my $method (@{$methods}) {
        $method->{cls} = $self;
        my $key = OneReflect::nameKey($method->{name});
        $self->{methods}{$key} = $method;
    }
    
    return $self;
}

sub getField
{
    my ( $self, $name ) = @_;
    my $key = OneReflect::nameKey($name);
    return $self->{fields}{$key};
}

sub getMethod
{
    my ( $self, $name ) = @_;
    my $key = OneReflect::nameKey($name);
    return $self->{methods}{$key};
}

sub getFields
{
    my ( $self ) = @_;
    return values(@{$self->fields});
}
sub getMethods
{
    my ( $self ) = @_;
    return values(@{$self->methods});
}

package OneField;

sub new
{
    my $class = shift;
    my $self = {};
    bless $self, $class;
    my ( $name, $isStatic, $type ) = @_;
    $self->{name} = $name;
    $self->{isStatic} = $isStatic;
    $self->{type} = $type;
    return $self;
}

sub getValue
{
    my ( $self, $obj ) = @_;
    my $fieldName = $self->{name};
    if ($self->{isStatic}) {
        $className = $self->{cls}->{name};
        return ${"$className::$fieldName"};
    } else {
        return $obj->{$fieldName};
    }
}

sub setValue
{
    my ( $self, $obj, $value ) = @_;
    my $fieldName = $self->{name};
    if ($self->{isStatic}) {
        $className = $self->{cls}->{name};
        ${"$className::$fieldName"} = $value;
    } else {
        $obj->{$fieldName} = $value;
    }
}

package OneMethod;

sub new
{
    my $class = shift;
    my $self = {};
    bless $self, $class;
    my ( $name, $isStatic, $returnType, $args ) = @_;
    $self->{name} = $name;
    $self->{isStatic} = $isStatic;
    $self->{returnType} = $returnType;
    $self->{args} = $args;
    return $self;
}

sub call
{
    my ( $self, $obj, $args ) = @_;
    my $methodName = $self->{name};
    if ($self->{isStatic}) {
        my $method = $self->{cls}->{name}->can($methodName);
        return $method->(@{$args});
    } else {
        return $obj->$methodName(@{$args});
    }
}

package OneMethodArgument;

sub new
{
    my $class = shift;
    my $self = {};
    bless $self, $class;
    my ( $name, $type ) = @_;
    $self->{name} = $name;
    $self->{type} = $type;
    return $self;
}

package OneReflect;

our $classes = {};

sub getClass
{
    my ($obj) = @_;
    my $name = ref $obj;
    return getClassByName($name);
}

sub getClassByName
{
    my ($name) = @_;
    my $key = nameKey($name);
    return $classes{$key};
}

sub setupClass
{
    my ($cls) = @_;
    my $key = nameKey($cls->{name});
    $classes{$key} = $cls;
}

sub nameKey
{
    my ($name) = @_;
    my $key = lc($name);
    $key =~ s/_//g;
    return $key;
}

1;