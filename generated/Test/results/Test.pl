use strict;
use warnings;

package TestClass;

sub new
{
    my $class = shift;
    my $self = {};
    bless $self, $class;
    return $self;
}

sub map_test {
    my ( $self ) = @_;
    my $map_obj = {
      x => 5,
      y => 3,
    };
    
    #let containsX = "x" in mapObj;
    ${$map_obj}{"z"} = 9;
    delete ${$map_obj}{"x"};
    
    my $keys_var = keys $map_obj;
    my $values_var = values $map_obj;
    return ${$map_obj}{"z"};
}

sub explicit_type_test {
    my ( $self ) = @_;
    my $op = "";
    print((length($op)) . "\n");
}

sub if_test {
    my ( $self, $x ) = @_;
    my $result = "<unk>";
    
    if ($x > 3) {
        $result = "hello";
    } elsif ($x < 1) {
        $result = "bello";
    } elsif ($x < 0) {
        $result = "bello2";
    } else {
        $result = "???";
    }
    
    if ($x > 3) {
        $result = "z";
    }
    
    if ($x > 3) {
        $result = "x";
    } else {
        $result = "y";
    }
    
    return $result;
}

sub array_test {
    my ( $self ) = @_;
    #const c2 = new Class2();
    
    my $mutable_arr = [1, 2];
    push @{$mutable_arr}, 3;
    push @{$mutable_arr}, 4;
    # mutableArr.push(c2.property);
    # mutableArr.push(c2.child.property);
    # mutableArr.push(c2.child.child.property);
    
    my $constant_arr = [5, 6];
    
    # some comment
    #   some comment line 2
    foreach my $item (@{$mutable_arr}) {
        print(($item) . "\n");
    }
    
    # some other comment
    # multiline and stuff
    for (my $i = 0; $i < scalar(@{$constant_arr}); $i++) {
        print((${$constant_arr}[$i]) . "\n");
    }
}

sub calc {
    my ( $self ) = @_;
    return (1 + 2) * 3;
}

sub method_with_args {
    my ( $self, $arg1, $arg2, $arg3 ) = @_;
    my $stuff = $arg1 + $arg2 + $arg3 * $self->calc();
    return $stuff;
}

sub string_test {
    my ( $self ) = @_;
    my $x = "x";
    my $y = "y";
    
    my $z = "z";
    $z .= "Z";
    $z .= $x;
    
    return $z . "|" . $x . $y;
}

sub reverse_string {
    my ( $self, $str ) = @_;
    my $result = "";
    for (my $i = length($str) - 1; $i >= 0; $i--) {
        $result .= (substr $str, $i, 1);
    }
    return $result;
}

sub get_bool_result {
    my ( $self, $value ) = @_;
    return $value;
}

sub test_method {
    my ( $self ) = @_;
    $self->array_test();
    print(($self->map_test()) . "\n");
    print(($self->string_test()) . "\n");
    print(($self->reverse_string("print value")) . "\n");
    print(($self->get_bool_result(1) ? "true" : "false") . "\n");
}

package Program;

eval {
    my $c = new TestClass();
    $c->test_method();
};
if ($@) {
    print "Exception: " . $@
}