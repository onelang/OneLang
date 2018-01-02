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

sub match_from_index
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
        my $key = OneReflect::name_key($field->{name});
        $self->{fields}{$key} = $field;
    }

    $self->{methods} = {};
    foreach my $method (@{$methods}) {
        $method->{cls} = $self;
        my $key = OneReflect::name_key($method->{name});
        $self->{methods}{$key} = $method;
    }
    
    return $self;
}

sub get_field
{
    my ( $self, $name ) = @_;
    my $key = OneReflect::name_key($name);
    return $self->{fields}{$key};
}

sub get_method
{
    my ( $self, $name ) = @_;
    my $key = OneReflect::name_key($name);
    return $self->{methods}{$key};
}

sub get_fields
{
    my ( $self ) = @_;
    return values(@{$self->fields});
}
sub get_methods
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

sub get_value
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

sub set_value
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

sub get_class
{
    my ($obj) = @_;
    my $name = ref $obj;
    return get_class_by_name($name);
}

sub get_class_by_name
{
    my ($name) = @_;
    my $key = name_key($name);
    return $classes{$key};
}

sub setup_class
{
    my ($cls) = @_;
    my $key = name_key($cls->{name});
    $classes{$key} = $cls;
}

sub name_key
{
    my ($name) = @_;
    my $key = lc($name);
    $key =~ s/_//g;
    return $key;
}

1;